#!/usr/bin/env node
/**
 * Import English Daily Chat content into the Hexo source tree.
 *
 * Reads chat/ at the site root and generates:
 *   source/_data/chat.json            - data for the dashboard and drills
 *   source/_posts/Chat/Days/...       - one annotated conversation page per day
 *   source/chat/index.md              - dashboard page (self-contained HTML/JS)
 *
 * Generated output is gitignored and recreated on every build, mirroring
 * tools/import-coach.js. chat/ is the source of truth.
 *
 * The conversation pages read as a chat log: Codex's turns are always visible,
 * the learner's turns show only the Chinese cue until revealed. Reading your own
 * mistake before trying to produce the sentence just rehearses the mistake, so
 * the original and the natural version are revealed together, never separately.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'source');
const POSTS = path.join(SOURCE, '_posts');
const DATA_DIR = path.join(SOURCE, '_data');
const CHAT = path.join(ROOT, 'chat');

const GENERATED = [
  path.join(POSTS, 'Chat'),
  path.join(SOURCE, 'chat'),
  path.join(DATA_DIR, 'chat.json'),
];

const SUMMARY_RE = /^day-(\d+)-(\d{8})\.md$/;

function readText(p) { return fs.readFileSync(p, 'utf8'); }

// The summary layout is a contract with english-daily-chat (see the Machine
// Contract section of its references/summary-format.md). A drifted heading does
// not crash anything - it just silently drops a drill card - so collect every
// mismatch and print a block at the end rather than one lost line mid-build.
const problems = [];
function complain(msg) { problems.push(msg); }

// Day number is the sequence key, not the date: two sessions can land on the
// same day, and then a date-only sort puts them in arbitrary (filename) order.
// Date stays as the tiebreaker for any hand-written row with a missing day.
function bySeq(a, b) {
  const da = parseInt(a.day, 10), db = parseInt(b.day, 10);
  if (Number.isFinite(da) && Number.isFinite(db) && da !== db) return da - db;
  return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
}

function readDirFiles(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile()).map((e) => e.name).sort();
  } catch (_) { return []; }
}

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}

function ensureClean() {
  for (const p of GENERATED) {
    const resolved = path.resolve(p);
    const sourceRoot = path.resolve(SOURCE);
    if (resolved !== sourceRoot && !resolved.startsWith(sourceRoot + path.sep)) {
      throw new Error('Refusing to clean path outside source/: ' + resolved);
    }
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}

function fmtDate(yyyymmdd) {
  return yyyymmdd.slice(0, 4) + '-' + yyyymmdd.slice(4, 6) + '-' + yyyymmdd.slice(6, 8);
}

function yamlScalar(v) {
  const s = String(v);
  if (/^[\w\s.,:()\-/]+$/.test(s) && !s.includes(': ')) return s;
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function frontmatter(fields) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || v === '') continue;
    lines.push(k + ': ' + yamlScalar(v));
  }
  lines.push('---');
  return lines.join('\n');
}

function siteRoot() {
  try {
    const m = /^root:\s*(\S+)/m.exec(readText(path.join(ROOT, '_config.yml')));
    if (m) return m[1].replace(/^["']|["']$/g, '');
  } catch (_) { /* ignore */ }
  return '/';
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Escape for HTML, then re-enable the small markdown subset the notes use. */
function inline(s) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return t;
}

/** Split a markdown table row, honouring escaped pipes. */
function cellsOf(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '')
    .split('|').map((c) => c.trim().replace(/\\\|/g, '|'));
}

function isTableRow(line) { return line.trim().startsWith('|'); }
function isSeparatorRow(line) { return /^\|[\s:|-]+\|$/.test(line.trim()); }

/**
 * Parse one summary file into structured turns.
 *
 * The format is fixed by english-daily-chat/references/summary-format.md:
 * every learner turn carries the question, the verbatim line, the Chinese
 * gloss, the full rewrite, a table of changes, and a verdict.
 */
function parseSummary(dir, base) {
  const m = SUMMARY_RE.exec(base);
  if (!m) return null;
  const lines = readText(path.join(dir, base)).split(/\r?\n/);

  let title = '';
  const meta = {};
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (!title && line.startsWith('# ')) {
      title = line.slice(2).trim();
      continue;
    }
    if (line.startsWith('## ')) {
      current = { heading: line.slice(3).trim(), lines: [] };
      sections.push(current);
      continue;
    }
    if (!current && /^Date:/.test(line.trim())) {
      for (const part of line.split('|')) {
        const kv = /^\s*([^:]+):\s*(.*)$/.exec(part);
        if (kv) meta[kv[1].trim().toLowerCase()] = kv[2].trim();
      }
      continue;
    }
    if (current) current.lines.push(line);
  }

  const convo = sections.find((s) => /^The Conversation$/i.test(s.heading));
  if (!convo) complain(base + ': no "## The Conversation" section.');
  const turns = convo ? parseTurns(convo.lines, base) : [];
  if (convo && !turns.length) complain(base + ': the conversation section parsed to zero turns.');
  const rest = sections.filter((s) => s !== convo &&
    !/^What We Talked About$/i.test(s.heading));
  const about = sections.find((s) => /^What We Talked About$/i.test(s.heading));

  const stem = base.replace(/\.md$/, '');
  const topic = title.replace(/^Day\s+\d+\s*-\s*/i, '').trim() || stem;

  return {
    stem,
    day: m[1],
    date: meta.date || fmtDate(m[2]),
    title,
    topic,
    category: meta.category || '',
    exchanges: +(meta.exchanges || turns.length) || turns.length,
    fixes: +(meta.fixes || 0) || 0,
    chunksOwned: meta['chunks owned'] || '',
    about: about ? about.lines.join('\n').trim() : '',
    turns,
    sections: rest.map((s) => ({ heading: s.heading, body: s.lines.join('\n').trim() }))
      .filter((s) => s.body),
  };
}

// Every change visible in the rewrite must be traceable to a row in the
// "What changed" table. A rewrite that silently repairs something is worse than
// no rewrite: the learner sees their sentence altered with no reason given, and
// a repeated mistake stops looking like a pattern because one of its two
// occurrences was never written down. Day 05 exchange 2 shipped with two
// unlisted repairs and the learner had to catch it by reading.
//
// Exact reconstruction is not possible, so this is a cheap proxy: every content
// word in the learner's line that vanished from the rewrite should be mentioned
// somewhere in the table. Function words are ignored, and so are turns whose
// note says nothing changed.
const AUDIT_STOP = new Set(('a an the this that these those i you he she it we they me him her us them my your his its our their ' +
  'is am are was were be been being do does did done have has had will would can could shall should may might must ' +
  'and or but so then than as if because of to in on at by for with from into out up down off over under about ' +
  'not no nor s t re ve ll d m too very just also only really quite there here what which who whom whose when where how why ' +
  'some any all each every both few more most other another such own same one two three').split(' '));

function contentWords(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ').split(/\s+/)
    .filter((w) => w && w.length > 2 && !AUDIT_STOP.has(w));
}

function auditRewrite(turn, label) {
  if (!turn.you || !turn.natural) return;
  if (/^\s*(nothing|only)\b/i.test(turn.note || '')) return;

  const kept = new Set(contentWords(turn.natural));
  const accounted = new Set();
  for (const c of turn.changes) {
    for (const w of contentWords(c.you + ' ' + c.why + ' ' + c.whyZh)) accounted.add(w);
  }

  // Only a RUN of consecutive unexplained words counts. Single-word swaps are
  // the normal texture of a rewrite - "carefully" becoming "properly" needs no
  // row of its own if the row above already covers that clause. A run of three
  // means a whole clause left the sentence with nothing said about it, which is
  // the failure actually worth catching.
  const RUN = 3;
  const words = contentWords(turn.you);
  let run = [];
  const runs = [];
  for (const w of words.concat([null])) {
    if (w && !kept.has(w) && !accounted.has(w)) { run.push(w); continue; }
    if (run.length >= RUN) runs.push(run.join(' '));
    run = [];
  }
  for (const r of runs) {
    complain(label + ' turn ' + turn.n + ': rewrite drops "' + r +
      '" with no "What changed" row explaining it.');
  }

  // KNOWN BLIND SPOT: this only sees words that DISAPPEAR, so a substitution
  // is invisible - "It's similar" -> "It looks similar" changes the stance while
  // dropping only the word "mine". A word-count heuristic was tried for this and
  // removed: a single table row legitimately covers a whole rewritten clause, so
  // counting differing words fired on 13 of 30 turns. A check that cries wolf is
  // worse than no check, because it trains everyone to skip the warning block.
  // Substitutions stay a human responsibility - see "Fold in the repairs".

}

/** Turn the conversation section into one record per exchange. */
function parseTurns(lines, label) {
  const blocks = [];
  let buf = [];
  for (const line of lines) {
    if (line.trim() === '---') { blocks.push(buf); buf = []; continue; }
    buf.push(line);
  }
  blocks.push(buf);

  const turns = [];
  for (const block of blocks) {
    const turn = { me: '', you: '', zh: '', natural: '', note: '', changes: [], native: '' };
    let field = null;
    let seen = false;

    for (const raw of block) {
      const line = raw.trim();
      let hit;

      if ((hit = /^\*\*(\d+)\.\s*Me:\*\*\s*(.*)$/.exec(line))) {
        turn.n = +hit[1]; turn.me = hit[2]; field = 'me'; seen = true; continue;
      }
      if (/^\*\*You said:\*\*/.test(line)) { field = 'you'; seen = true; continue; }
      if ((hit = /^\*\*中文：\*\*\s*(.*)$/.exec(line))) {
        turn.zh = hit[1]; field = 'zh'; seen = true; continue;
      }
      if (/^\*\*Say it like this:\*\*/.test(line)) { field = 'natural'; seen = true; continue; }
      if ((hit = /^\*\*What changed:\*\*\s*(.*)$/.exec(line))) {
        turn.note = hit[1]; field = 'changed'; seen = true; continue;
      }
      if ((hit = /^\*\*Native:\*\*\s*(.*)$/.exec(line))) {
        turn.native = hit[1]; field = null; seen = true; continue;
      }

      if (!line) continue;

      if (field === 'you' || field === 'natural') {
        const text = line.replace(/^>\s?/, '');
        turn[field] = turn[field] ? turn[field] + ' ' + text : text;
      } else if (field === 'me') {
        turn.me = turn.me ? turn.me + ' ' + line : line;
      } else if (field === 'zh') {
        turn.zh += line;
      } else if (field === 'changed') {
        if (isSeparatorRow(line)) continue;
        if (isTableRow(line)) {
          const c = cellsOf(line);
          if (!/^\d+$/.test(c[0])) continue;    // header row
          turn.changes.push({
            n: +c[0], you: c[1] || '', natural: c[2] || '',
            label: c[3] || '', why: c[4] || '', whyZh: c[5] || '',
          });
        } else {
          turn.note = turn.note ? turn.note + ' ' + line : line;
        }
      }
    }

    if (!seen) continue;
    if (!turn.n) {
      complain(label + ': a conversation block has no "**N. Me:**" heading, so it was skipped.');
      continue;
    }
    if (!turn.you) complain(label + ' turn ' + turn.n + ': no "**You said:**" line.');
    if (!turn.natural) complain(label + ' turn ' + turn.n + ': no "**Say it like this:**" rewrite.');
    if (!turn.zh) {
      complain(label + ' turn ' + turn.n + ': no "**中文：**" cue - produces no whole-turn drill card.');
    }
    auditRewrite(turn, label);
    turns.push(turn);
  }
  return turns.sort((a, b) => a.n - b.n);
}

/** Generic reader for the script-maintained tables in chat/. */
function parseTable(file, idRe, keys) {
  const p = path.join(CHAT, file);
  if (!fs.existsSync(p)) return [];
  const out = [];
  for (const line of readText(p).split(/\r?\n/)) {
    if (!isTableRow(line) || isSeparatorRow(line)) continue;
    const c = cellsOf(line);
    if (!idRe.test(c[0])) continue;
    const row = {};
    keys.forEach((k, i) => { row[k] = c[i] === undefined ? '' : c[i]; });
    out.push(row);
  }
  return out;
}

function parseChunks() {
  return parseTable('chunks.md', /^C\d+$/,
    ['id', 'chunk', 'means', 'example', 'day', 'tried', 'used', 'status', 'next'])
    .map((r) => ({ ...r, tried: +r.tried || 0, used: +r.used || 0 }));
}

function parseErrors() {
  return parseTable('errors.md', /^E\d+$/,
    ['id', 'pattern', 'category', 'said', 'fix', 'day', 'hits', 'status', 'next'])
    .map((r) => ({ ...r, hits: +r.hits || 0 }));
}

function parseSessions() {
  return parseTable('index.md', /^\d+$/,
    ['day', 'date', 'topic', 'category', 'exchanges', 'fixes', 'status', 'summary'])
    .map((r) => ({
      ...r,
      exchanges: +r.exchanges || 0,
      fixes: +r.fixes || 0,
      summary: undefined,
    }));
}

const DASH_STYLE = `
<style>
.chat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin:1.4em 0}
.chat-stat{border:1px solid #e3e8ef;border-radius:10px;padding:14px 16px;background:#fff}
.chat-stat b{display:block;font-size:1.9em;line-height:1.1;color:#3b82f6}
.chat-stat span{font-size:.82em;color:#888;text-transform:uppercase;letter-spacing:.04em}
.chat-bar{height:9px;border-radius:5px;background:#eef1f5;overflow:hidden;margin:6px 0 2px}
.chat-bar i{display:block;height:100%;background:#3b82f6}
.chat-tag{display:inline-block;font-size:.72em;font-weight:700;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#4338ca;margin-left:6px}
.chat-tag.wrong{background:#fee2e2;color:#b91c1c}
.chat-tag.awkward{background:#ffedd5;color:#c2410c}
.chat-tag.bookish{background:#fef9c3;color:#a16207}
.chat-tag.register{background:#fef9c3;color:#a16207}
.chat-tag.calque{background:#fae8ff;color:#a21caf}
.chat-tag.unchanged{background:#e0f2fe;color:#0369a1}
.chat-tag.optional{background:#f1f5f9;color:#64748b}
.chat-tag.clean{background:#dcfce7;color:#15803d}
.chat-filters{display:flex;flex-wrap:wrap;gap:8px;margin:1em 0}
.chat-filters button{padding:5px 13px;border:1px solid #dbe3ef;border-radius:999px;background:#fff;cursor:pointer;font:inherit;font-size:.85em}
.chat-filters button.on{background:#3b82f6;border-color:#3b82f6;color:#fff}

/* ---- conversation flow ---- */
.cx{margin:1.6em 0}
.cx-row{display:flex;margin:14px 0;gap:10px}
.cx-row.them{justify-content:flex-start}
.cx-row.you{justify-content:flex-end}
.cx-who{font-size:.72em;color:#9aa4b0;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
.cx-bub{max-width:min(680px,86%);border:1px solid #e3e8ef;border-radius:14px;padding:11px 15px;background:#fff;line-height:1.62}
.cx-row.them .cx-bub{border-bottom-left-radius:4px}
.cx-row.you .cx-bub{border-bottom-right-radius:4px;background:#f6f9ff;border-color:#dbe6fb}
.cx-cue{color:#5b6675;font-size:.95em}
.cx-cue .lead{color:#9aa4b0;font-size:.85em;display:block;margin-bottom:3px}
.cx-hold{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}
.cx-hold button{padding:5px 14px;border:1px solid #c7d7f5;border-radius:8px;background:#fff;cursor:pointer;font:inherit;font-size:.85em;color:#2563eb}
.cx-hold button:hover{background:#eef4ff}
.cx-hold small{color:#9aa4b0}
.cx-said{color:#b91c1c;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.95em;line-height:1.6}
.cx-nat{color:#047857;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.95em;line-height:1.6;margin-top:2px}
.cx-bub,.cx-said,.cx-nat,.cx-cue,.cx-note,.cx-ch td{overflow-wrap:anywhere;word-break:break-word}
.cx-lab{font-size:.72em;color:#9aa4b0;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px}
.cx-split{margin-top:10px;padding-top:10px;border-top:1px dashed #dbe3ef}
.cx-note{color:#666;font-size:.9em;margin-top:8px}
.cx-ch{margin-top:10px;border-top:1px dashed #dbe3ef;padding-top:8px}
.cx-ch table{width:100%;border-collapse:collapse;font-size:.88em;margin:0;table-layout:fixed}
.cx-ch td{padding:5px 7px;border-bottom:1px solid #f0f3f7;vertical-align:top}
.cx-ch tr:last-child td{border-bottom:0}
.cx-ch .a{color:#b91c1c}
.cx-ch .b{color:#047857}
.cx-ch td.a,.cx-ch td.b{width:38%}
.cx-ch .zh{color:#7a8493}
.cx-meta{text-align:center;color:#9aa4b0;font-size:.8em;margin:6px 0}
.cx-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:1em 0}
.cx-toggle{padding:5px 13px;border:1px solid #dbe3ef;border-radius:999px;background:#fff;color:#2563eb;cursor:pointer;font:inherit;font-size:.85em}
.cx-toggle:hover{background:#eef4ff}
.cx-tip{color:#9aa4b0}

/* ---- drill ---- */
.drill{border:1px solid #dbe3ef;border-radius:12px;padding:16px 18px;margin:1em 0;background:#fff}
.drill-top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px}
.drill-top .chat-tag{margin-left:0}
.drill-top .grow{flex:1 1 auto}
.drill-q{font-size:.9em;color:#888;margin-bottom:4px}
.drill-prompt{font-size:1.02em;line-height:1.6;padding:10px 14px;border-left:3px solid #3b82f6;background:#f6f9ff;border-radius:0 8px 8px 0}
.drill-cue{font-size:1.05em;line-height:1.7;margin-top:10px;color:#334155}
.drill-hint{color:#888;font-size:.85em;margin-top:8px}
.drill-layer{margin-top:10px;font-size:.92em;color:#555}
.drill-ans{margin-top:14px;padding-top:12px;border-top:1px dashed #dbe3ef}
.drill-ans .fix{color:#047857;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:1.02em;line-height:1.6}
.drill-was{color:#b91c1c;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.95em;margin-top:8px;line-height:1.6}
.drill-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.drill-btns button{padding:7px 16px;border:1px solid #dbe3ef;border-radius:8px;background:#fff;cursor:pointer;font:inherit;font-size:.9em}
.drill-btns button.primary{background:#3b82f6;border-color:#3b82f6;color:#fff}
.drill-btns button.good{border-color:#047857;color:#047857}
.drill-btns button.bad{border-color:#b91c1c;color:#b91c1c}
.drill-bar{height:6px;border-radius:3px;background:#eceff3;overflow:hidden;margin-top:12px}
.drill-bar i{display:block;height:100%;background:#3b82f6}
.drill-done{text-align:center;padding:10px 0}
.drill-score{font-size:1.6em;font-weight:700}

/* ---- lists ---- */
.chat-card{border:1px solid #e3e8ef;border-radius:10px;padding:12px 16px;margin-bottom:10px;background:#fff}
.chat-card.due{border-left:4px solid #f59e0b}
.chat-card.owned{border-left:4px solid #10b981}
.chat-card .ctx{color:#666;font-size:.88em;margin:2px 0 6px}
.chat-card .said{color:#b91c1c;font-family:ui-monospace,monospace;font-size:.9em}
.chat-card .fix{color:#047857;font-family:ui-monospace,monospace;font-size:.9em}
.chat-day{display:flex;flex-wrap:wrap;gap:10px;align-items:baseline;border:1px solid #e3e8ef;border-radius:10px;padding:12px 16px;margin-bottom:10px;background:#fff}
.chat-day a{font-weight:600}
.chat-day .grow{flex:1 1 auto}
.chat-day small{color:#9aa4b0}

html[data-theme="dark"] .chat-stat,html[data-theme="dark"] .chat-card,
html[data-theme="dark"] .chat-day,html[data-theme="dark"] .drill,
html[data-theme="dark"] .cx-bub{background:#1d232b;border-color:#2e3640}
html[data-theme="dark"] .cx-row.you .cx-bub{background:#1a2330;border-color:#2f3d52}
html[data-theme="dark"] .drill-btns button,html[data-theme="dark"] .cx-hold button,
html[data-theme="dark"] .chat-filters button,
html[data-theme="dark"] .cx-toggle{background:#20262e;border-color:#333c47;color:#aeb8c2}
html[data-theme="dark"] .cx-toggle:hover,html[data-theme="dark"] .cx-hold button:hover{background:#28303a}
html[data-theme="dark"] .chat-filters button.on{background:#3b82f6;border-color:#3b82f6;color:#fff}
html[data-theme="dark"] .drill-btns button.primary{background:#3b82f6;border-color:#3b82f6;color:#fff}
html[data-theme="dark"] .drill-prompt{background:#1a2330}
html[data-theme="dark"] .cx-said,html[data-theme="dark"] .chat-card .said,
html[data-theme="dark"] .cx-ch .a{color:#fca5a5}
html[data-theme="dark"] .cx-nat,html[data-theme="dark"] .chat-card .fix,
html[data-theme="dark"] .drill-ans .fix,html[data-theme="dark"] .cx-ch .b{color:#6ee7b7}
html[data-theme="dark"] .cx-note,html[data-theme="dark"] .chat-card .ctx{color:#a8b3bf}
html[data-theme="dark"] .cx-ch .zh{color:#98a2ae}
html[data-theme="dark"] .drill-was{color:#fca5a5}
html[data-theme="dark"] .chat-bar{background:#262e37}
html[data-theme="dark"] .cx-ch td{border-bottom-color:#2a323b}
html[data-theme="dark"] .cx-cue,html[data-theme="dark"] .drill-cue{color:#c2ccd6}
@media (max-width:640px){
  .cx-bub{max-width:100%}
  .cx-row.them .cx-bub,.cx-row.you>div{max-width:100%!important}
  .cx-ch table,.cx-ch tbody,.cx-ch tr,.cx-ch td{display:block;width:auto!important}
  .cx-ch tr{padding:6px 0}
  .cx-ch td{border-bottom:0;padding:2px 0}
  .cx-ch td.b::before{content:"→ ";opacity:.6}
  .cx-ch tr:has(td.a){border-bottom:1px solid #f0f3f7}
  .cx-ch table{table-layout:auto}
}
html[data-theme="dark"] .cx-ch tr:has(td.a){border-bottom-color:#2a323b}
@media print{.cx-hold{display:none}.cx-bub{max-width:100%}}
</style>
`;

/** One learner turn, rendered as a chat bubble that hides its answer. */
function renderTurn(t) {
  const out = [];
  const verdict = (t.native || '').toLowerCase();
  const clean = /^(clean|natural)/.test(verdict);

  out.push('<div class="cx-row them"><div><div class="cx-who">Codex</div>' +
    '<div class="cx-bub">' + inline(t.me) + '</div></div></div>');

  const answer = [];
  answer.push('<div class="cx-split">');
  answer.push('<div class="cx-lab">You said</div>');
  answer.push('<div class="cx-said">' + inline(t.you) + '</div>');
  answer.push('<div class="cx-lab" style="margin-top:9px">Say it like this</div>');
  answer.push('<div class="cx-nat">' + inline(t.natural) + '</div>');
  if (t.note) answer.push('<div class="cx-note">' + inline(t.note) + '</div>');
  if (t.changes.length) {
    answer.push('<div class="cx-ch"><table><tbody>');
    for (const c of t.changes) {
      const lab = (c.label || '').split(' ')[0].toLowerCase();
      answer.push('<tr>' +
        '<td class="a">' + inline(c.you) + '</td>' +
        '<td class="b">' + inline(c.natural) + '</td>' +
        '<td><span class="chat-tag ' + esc(lab) + '">' + inline(c.label) + '</span></td>' +
        '</tr>' +
        '<tr><td colspan="3" class="zh">' + inline(c.why) +
        (c.whyZh ? ' <span style="opacity:.85">' + inline(c.whyZh) + '</span>' : '') +
        '</td></tr>');
    }
    answer.push('</tbody></table></div>');
  }
  answer.push('<div class="cx-lab" style="margin-top:9px">Native</div>' +
    '<div class="cx-note" style="margin-top:0">' +
    (clean ? '\u5df2\u7ecf\u5f88\u81ea\u7136' : esc(t.native || '-')) + '</div>');
  answer.push('</div>');

  out.push('<div class="cx-row you"><div style="max-width:min(680px,86%)">' +
    '<div class="cx-who" style="text-align:right">You &middot; ' + esc(t.n) + '</div>' +
    '<div class="cx-bub" data-turn="' + esc(t.n) + '">' +
      '<div class="cx-cue"><span class="lead">你想说的是</span>' + inline(t.zh || '(no gloss)') + '</div>' +
      '<div class="cx-hold">' +
        '<button type="button" data-cx="show">看答案</button>' +
        '<small>先自己说一遍' + (clean ? '' : '') + '</small>' +
      '</div>' +
      '<div class="cx-ans" hidden>' + answer.join('') + '</div>' +
    '</div></div></div>');

  return out.join('\n');
}

/**
 * Reveal handler for the day pages. Kept tiny and standalone so a conversation
 * page carries no dependency on the dashboard bundle.
 */
const CONVO_SCRIPT = `
<script>
(function(){
  var root = document.getElementById('cx');
  if (!root) return;
  function setOne(bub, open){
    var ans = bub.querySelector('.cx-ans');
    var btn = bub.querySelector('[data-cx="show"]');
    if (!ans || !btn) return;
    ans.hidden = !open;
    btn.textContent = open ? '收起' : '看答案';
  }
  root.addEventListener('click', function(ev){
    var btn = ev.target.closest('[data-cx="show"]');
    if (!btn) return;
    var bub = btn.closest('.cx-bub');
    setOne(bub, bub.querySelector('.cx-ans').hidden);
  });
  var all = document.getElementById('cxAll');
  if (all){
    all.addEventListener('click', function(){
      var bubs = [].slice.call(root.querySelectorAll('.cx-bub'));
      var anyHidden = bubs.some(function(b){
        var a = b.querySelector('.cx-ans'); return a && a.hidden;
      });
      bubs.forEach(function(b){ setOne(b, anyHidden); });
      all.textContent = anyHidden ? '全部收起' : '全部展开';
    });
  }
})();
</script>
`;

function renderConversation(day) {
  const parts = [];
  parts.push('<div class="cx-toolbar">' +
    '<button type="button" id="cxAll" class="cx-toggle">全部展开</button>' +
    '<small class="cx-tip">每一轮先看中文，自己说出来，再点开对照。</small>' +
    '</div>');
  parts.push('<div class="cx" id="cx">');
  for (const t of day.turns) parts.push(renderTurn(t));
  parts.push('</div>');
  return parts.join('\n');
}

function postTime(day) {
  const n = parseInt(day, 10);
  const mins = Number.isFinite(n) ? n % 60 : 0;
  return '20:' + String(mins).padStart(2, '0') + ':00';
}

function writeDayPages(days, root) {
  const meta = [];
  for (const d of days) {
    const url = root.replace(/\/$/, '/') + 'chat/days/' + d.stem + '/';
    meta.push({
      day: d.day, date: d.date, topic: d.topic, category: d.category,
      exchanges: d.exchanges, fixes: d.fixes, title: d.title, url,
      turns: d.turns.length,
    });

    const body = [];
    if (d.about) body.push(d.about, '');
    body.push(DASH_STYLE);
    body.push('## The Conversation', '');
    body.push(renderConversation(d));
    body.push(CONVO_SCRIPT);
    for (const s of d.sections) {
      body.push('', '## ' + s.heading, '', s.body);
    }
    body.push('');

    writeFile(
      path.join(POSTS, 'Chat', 'Days', d.stem + '.md'),
      frontmatter({
        title: d.title,
        // Offset by day number so two sessions on one date still order
        // correctly in Hexo's own date-sorted archive.
        date: d.date + ' ' + postTime(d.day),
        permalink: 'chat/days/' + d.stem + '/',
        chat_day: d.day,
        chat_topic: d.topic,
        chat_category: d.category,
      }) + '\n\n' + body.join('\n')
    );
  }
  return meta.sort((a, b) => bySeq(b, a));
}

const DASH_SCRIPT = `
<script>
(function(){
  var D = window.CHAT_DATA || {};
  var days = D.days || [], chunks = D.chunks || [], errors = D.errors || [];
  var cards = D.cards || [];
  var today = new Date().toISOString().slice(0,10);
  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function due(d){ return d && d <= today; }

  // ---- stats ----
  var owned = chunks.filter(function(c){ return c.status === 'owned'; }).length;
  var openErr = errors.filter(function(e){ return e.status === 'open'; }).length;
  var dueNow = chunks.filter(function(c){ return c.status !== 'owned' && due(c.next); }).length +
               errors.filter(function(e){ return e.status === 'open' && due(e.next); }).length;
  var turns = days.reduce(function(n,d){ return n + (d.turns||0); }, 0);

  var s = el('chatStats');
  if (s){
    s.innerHTML =
      stat(days.length, 'sessions') + stat(turns, 'exchanges') +
      stat(owned + ' / ' + chunks.length, 'chunks owned') +
      stat(openErr, 'open errors') + stat(dueNow, 'due today');
  }
  function stat(v,l){ return '<div class="chat-stat"><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>'; }

  var pr = el('chatProgress');
  if (pr && chunks.length){
    var pct = Math.round(owned / chunks.length * 100);
    pr.innerHTML = '<div class="chat-bar"><i style="width:' + pct + '%"></i></div>' +
      '<small>A chunk counts as owned after two unprompted uses in a new context.</small>';
  }

  // ---- drill ----
  // Two decks. "turn" replays a whole answer from its Chinese cue, which trains
  // producing a paragraph. "point" drills one collocation. Both hide your original
  // sentence until the reveal: reading the mistake first only rehearses it.
  // Nothing is persisted. Self-grading ("I knew that") is a much weaker signal
  // than producing an expression unprompted in a real conversation, and the
  // authoritative record already lives in chat/chunks.md and chat/errors.md,
  // maintained by the skill and tracked in git. A second, self-reported
  // scoreboard in the browser would compete with that while being worth less.
  // It also keeps this public, unauthenticated page free of writable state.
  // dstats lives for the lifetime of the page and is deliberately lost on reload.
  var dstats = {};
  var drill = { mode:'turn', queue:[], i:0, shown:false, hint:0, right:0, wrong:0, hinted:0 };

  function buildQueue(){
    var pool = cards.filter(function(c){ return c.mode === drill.mode; });
    // With no history to weight by, draw at random. Ordering by "weakest first"
    // would be a lie once the tally resets on reload; a fresh shuffle at least
    // varies the context, which is what makes a chunk portable.
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    drill.queue = pool.slice(0, 12);
    drill.i = 0; drill.shown = false; drill.hint = 0;
    drill.right = 0; drill.wrong = 0; drill.hinted = 0;
  }

  function openingOf(t){
    var w = String(t||'').trim().split(/\\s+/);
    return w.slice(0, Math.min(3, Math.max(1, Math.ceil(w.length/4)))).join(' ') + ' ...';
  }

  function renderDrill(){
    var box = el('chatDrill');
    if (!box) return;
    if (!drill.queue.length){
      box.innerHTML = '<div class="drill"><p>Nothing to drill yet.</p></div>';
      return;
    }
    if (drill.i >= drill.queue.length){
      var tot = drill.right + drill.hinted + drill.wrong;
      box.innerHTML = '<div class="drill"><div class="drill-done">' +
        '<div class="drill-score">' + drill.right + ' / ' + tot + '</div>' +
        '<p><b>' + drill.right + '</b> clean &middot; <b>' + drill.hinted +
        '</b> with a hint &middot; <b>' + drill.wrong + '</b> missed</p>' +
        '<p>' + (tot && drill.right >= tot*0.8 ? 'Strong recall.' :
          drill.wrong > tot/2 ? 'Say these out loud, not in your head.' :
          'The missed ones come back first next time.') + '</p>' +
        '<div class="drill-btns" style="justify-content:center">' +
        '<button class="primary" data-d="again">Drill again</button></div></div></div>';
      return;
    }
    var c = drill.queue[drill.i];
    var st = dstats[c.key] || {};
    var h = drill.hint;

    box.innerHTML = '<div class="drill">' +
      '<div class="drill-top">' +
        '<span class="chat-tag">' + (c.mode === 'turn' ? '整轮复述' : '单点') + '</span>' +
        (drill.shown ? '<span class="chat-tag">day ' + esc(c.day) + '</span>' +
          (c.label ? '<span class="chat-tag ' + esc((c.label||'').split(' ')[0].toLowerCase()) +
            '">' + esc(c.label) + '</span>' : '') +
          (st.miss ? '<span class="chat-tag">missed ' + st.miss +
            'x this sitting</span>' : '') : '') +
        '<span class="grow"></span>' +
        '<small>' + (drill.i+1) + ' / ' + drill.queue.length + '</small>' +
      '</div>' +
      (c.prompt ? '<div class="drill-q">Situation</div>' +
        '<div class="drill-prompt">' + esc(c.prompt) + '</div>' : '') +
      '<div class="drill-q" style="margin-top:12px">' +
        (c.mode === 'turn' ? '用英语说出这个意思' : '这句话怎么说更地道') + '</div>' +
      '<div class="drill-cue">' + esc(c.cue) + '</div>' +
      (h >= 1 && !drill.shown && c.hint ?
        '<div class="drill-layer"><b>Hint</b> ' + esc(c.hint) + '</div>' : '') +
      (h >= 2 && !drill.shown ?
        '<div class="drill-layer"><b>Opening</b> <code>' + esc(openingOf(c.answer)) + '</code></div>' : '') +
      (drill.shown ? '' : '<div class="drill-hint">Say it out loud, then reveal.</div>') +
      (drill.shown ?
        '<div class="drill-ans"><div class="drill-q">Natural version</div>' +
        '<div class="fix">' + esc(c.answer) + '</div>' +
        (c.said ? '<div class="drill-was">You said: ' + esc(c.said) + '</div>' : '') +
        (c.why ? '<div class="drill-q" style="margin-top:8px">' + esc(c.why) + '</div>' : '') +
        (c.url ? '<div class="drill-q"><a href="' + esc(c.url) + '">看当天的对话</a></div>' : '') +
        '</div>' : '') +
      '<div class="drill-btns">' +
        (drill.shown ?
          '<button class="good" data-d="ok">Got it clean</button>' +
          (h > 0 ? '<button data-d="hinted">Needed the hint</button>' : '') +
          '<button class="bad" data-d="miss">Missed it</button>' :
          (h < 2 ? '<button data-d="hint">Hint</button>' : '') +
          '<button class="primary" data-d="show">Show answer</button>' +
          '<button data-d="skip">Skip</button>') +
      '</div>' +
      '<div class="drill-bar"><i style="width:' +
        Math.round(drill.i / drill.queue.length * 100) + '%"></i></div>' +
    '</div>';
  }

  function act(a){
    var c = drill.queue[drill.i];
    function advance(){ drill.i++; drill.shown = false; drill.hint = 0; }
    if (a === 'hint'){ drill.hint = Math.min(2, drill.hint + 1); }
    else if (a === 'show'){ drill.shown = true; }
    else if (a === 'again'){ buildQueue(); }
    else if (a === 'skip'){ advance(); }
    else if (a === 'ok' || a === 'miss' || a === 'hinted'){
      if (!c) return;
      var st = dstats[c.key] || { ok:0, miss:0, hinted:0 };
      st.seen = (st.seen||0) + 1;
      if (a === 'ok'){ st.ok = (st.ok||0)+1; drill.right++; }
      else if (a === 'hinted'){ st.hinted = (st.hinted||0)+1; drill.hinted++; }
      else { st.miss = (st.miss||0)+1; drill.wrong++; }
      st.last = today;
      dstats[c.key] = st;
      advance();
    }
    renderDrill();
  }

  var db = el('chatDrill');
  if (db){
    db.addEventListener('click', function(ev){
      var b = ev.target.closest('button[data-d]');
      if (b) act(b.getAttribute('data-d'));
    });
    var ms = el('chatDrillMode');
    if (ms){
      ms.addEventListener('click', function(ev){
        var b = ev.target.closest('button[data-m]');
        if (!b) return;
        drill.mode = b.getAttribute('data-m');
        [].forEach.call(ms.querySelectorAll('button'), function(x){
          x.classList.toggle('on', x === b);
        });
        buildQueue(); renderDrill();
      });
    }
    document.addEventListener('keydown', function(ev){
      if (/^(INPUT|TEXTAREA)$/.test((ev.target.tagName||''))) return;
      var r = db.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var k = ev.key;
      if (k === 'h'){ ev.preventDefault(); act('hint'); }
      else if (k === ' '){ ev.preventDefault(); act(drill.shown ? 'skip' : 'show'); }
      else if (k === '1' && drill.shown){ act('ok'); }
      else if (k === '2' && drill.shown && drill.hint > 0){ act('hinted'); }
      else if (k === '3' && drill.shown){ act('miss'); }
    });
    buildQueue(); renderDrill();
  }

  // ---- chunk bank ----
  // Only owned chunks are listed. Reading the pending ones would defeat the
  // silent seeding they depend on, so they are shown as a count and nothing more.
  var cb = el('chatChunks');
  if (cb){
    var own = chunks.filter(function(c){ return c.status === 'owned'; });
    var pending = chunks.length - own.length;
    cb.innerHTML = (own.length ? own.map(function(c){
      return '<div class="chat-card owned"><b>' + esc(c.chunk) + '</b>' +
        '<span class="chat-tag">day ' + esc(c.day) + '</span>' +
        '<div class="ctx">' + esc(c.means) + '</div>' +
        '<div class="fix">' + esc(c.example) + '</div></div>';
    }).join('') : '<div class="chat-card"><p>Nothing owned yet. A chunk needs two ' +
      'unprompted uses in a new context.</p></div>') +
      (pending ? '<div class="chat-card"><b>' + pending + ' still in circulation</b>' +
        '<div class="ctx">Deliberately not listed - they are seeded into topics ' +
        'silently, and reading them first would invalidate the test.</div></div>' : '');
  }

  // ---- error log ----
  var ef = el('chatErrFilters'), eb = el('chatErrors');
  // Default to whatever actually has rows. Landing on an empty "due" list
  // reads as "nothing logged" rather than "nothing scheduled for today".
  var anyDue = errors.some(function(e){ return e.status === 'open' && due(e.next); });
  var efilter = anyDue ? 'due' : 'open';
  function renderErrs(){
    if (!eb) return;
    var rows = errors.filter(function(e){
      if (efilter === 'due') return e.status === 'open' && due(e.next);
      if (efilter === 'open') return e.status === 'open';
      if (efilter === 'resolved') return e.status !== 'open';
      return true;
    });
    if (!rows.length){ eb.innerHTML = '<p>Nothing here.</p>'; return; }
    eb.innerHTML = rows.map(function(e){
      return '<div class="chat-card' + (due(e.next) && e.status === 'open' ? ' due' : '') + '">' +
        '<b>' + esc(e.pattern) + '</b><span class="chat-tag">' + esc(e.category) + '</span>' +
        '<span class="chat-tag">day ' + esc(e.day) + '</span>' +
        (e.hits > 1 ? '<span class="chat-tag">hits ' + esc(e.hits) + '</span>' : '') +
        '<div class="said">' + esc(e.said) + '</div>' +
        '<div class="fix">' + esc(e.fix) + '</div></div>';
    }).join('');
  }
  if (ef){
    var opts = [['due','Due today'],['open','All open'],['resolved','Resolved'],['all','Everything']];
    ef.innerHTML = opts.map(function(o){
      return '<button data-f="' + o[0] + '"' + (o[0]===efilter?' class="on"':'') + '>' + o[1] + '</button>';
    }).join('');
    ef.addEventListener('click', function(ev){
      var b = ev.target.closest('button[data-f]');
      if (!b) return;
      efilter = b.getAttribute('data-f');
      [].forEach.call(ef.querySelectorAll('button'), function(x){ x.classList.toggle('on', x===b); });
      renderErrs();
    });
  }
  renderErrs();

  // ---- sessions ----
  var sb = el('chatDays');
  if (sb){
    sb.innerHTML = days.map(function(d){
      return '<div class="chat-day"><a href="' + esc(d.url) + '">Day ' + esc(d.day) + ' - ' +
        esc(d.topic) + '</a><span class="chat-tag">' + esc(d.category) + '</span>' +
        '<span class="grow"></span><small>' + esc(d.date) + ' &middot; ' +
        esc(d.exchanges) + ' exchanges &middot; ' + esc(d.fixes) + ' fixes</small></div>';
    }).join('') || '<p>No sessions yet.</p>';
  }
})();
</script>
`;

/**
 * Build the drill decks from the parsed conversations.
 *
 * turn cards  - Chinese gloss in, whole natural answer out.
 * point cards - one change from the What-changed table.
 *
 * A turn that needed no repair still makes a card: reproducing an answer that
 * was already right is worth as much as fixing a broken one. Rows whose "you
 * wrote" cell is empty or "(nothing)" are deletions and make no usable prompt,
 * so they are dropped.
 */
function buildCards(days) {
  const cards = [];
  for (const d of days) {
    for (const t of d.turns) {
      if (t.zh && t.natural) {
        cards.push({
          key: 'T' + d.day + '.' + t.n,
          mode: 'turn',
          day: d.day,
          prompt: t.me,
          cue: t.zh,
          answer: t.natural,
          said: t.you,
          hint: t.changes.length
            ? t.changes.map((c) => c.label).filter(Boolean).join(', ')
            : 'already natural',
          why: t.changes.map((c) => c.why).filter(Boolean).join(' '),
          label: t.native,
          url: d.url,
        });
      }
      for (const c of t.changes) {
        const from = (c.you || '').trim();
        const to = (c.natural || '').trim();
        if (!from || !to) continue;
        if (/^\(?nothing\)?$/i.test(from) || /^\(?nothing\)?$/i.test(to)) continue;
        // A row documenting that nothing changed - a reverted swap, or a note on
        // where a phrase came from - has no recall answer, so it is not a card.
        if (from === to) continue;
        cards.push({
          key: 'P' + d.day + '.' + t.n + '.' + c.n,
          mode: 'point',
          day: d.day,
          prompt: '',
          cue: c.whyZh || c.why || from,
          answer: to,
          said: from,
          hint: c.label,
          why: c.why,
          label: c.label,
          url: d.url,
        });
      }
    }
  }
  return cards;
}

// Hexo renders the page, so a syntax error in an emitted script is invisible
// until the browser hits it. Parse every generated script at build time instead.
function assertScriptParses(label, html) {
  const bodies = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  for (const body of bodies) {
    if (!body.trim()) continue;
    if (/^\s*window\.CHAT_DATA\s*=/.test(body.trim())) continue;
    try {
      new Function(body);
    } catch (err) {
      throw new Error(label + ': generated script does not parse -> ' + err.message);
    }
  }
}

function main() {
  ensureClean();
  if (!fs.existsSync(CHAT)) {
    console.log('No chat/ directory; nothing to import.');
    return;
  }

  const summaryDir = path.join(CHAT, 'summaries');
  const days = [];
  for (const base of readDirFiles(summaryDir)) {
    const parsed = parseSummary(summaryDir, base);
    if (parsed) days.push(parsed);
  }
  days.sort(bySeq);

  // The summary header states its own exchange count. If the parse disagrees,
  // an anchor has drifted and cards are missing.
  for (const d of days) {
    if (d.exchanges && d.turns.length !== d.exchanges) {
      complain(d.stem + ': header says ' + d.exchanges + ' exchanges but ' +
        d.turns.length + ' parsed.');
    }
  }

  const root = siteRoot().endsWith('/') ? siteRoot() : siteRoot() + '/';
  const dayMeta = writeDayPages(days, root);

  // writeDayPages assigns the url; mirror it back so the cards can link.
  const urlByStem = {};
  for (const m of dayMeta) urlByStem[m.day] = m.url;
  for (const d of days) d.url = urlByStem[d.day] || '';

  const chunks = parseChunks();
  const errors = parseErrors();
  const cards = buildCards(days);

  const data = {
    generated: new Date().toISOString(),
    days: dayMeta, chunks, errors, cards,
  };
  writeFile(path.join(DATA_DIR, 'chat.json'), JSON.stringify(data, null, 2) + '\n');

  const page = [
    frontmatter({ title: 'Daily Chat', layout: 'page' }),
    '',
    'One small-talk topic a day, corrected as it goes. Each exchange shows the Chinese',
    'cue first - say your version out loud, then reveal what you actually said next to',
    'the natural one.',
    'Generated from `chat/` by `tools/import-chat.js`.',
    '',
    DASH_STYLE,
    '<div id="chatStats" class="chat-grid"></div>',
    '<div id="chatProgress"></div>',
    '',
    '## Recall Drill',
    '',
    '`整轮复述` replays a whole answer from its Chinese cue. `单点` drills one',
    'collocation. Your original sentence stays hidden until you reveal - reading the',
    'mistake first only rehearses it.',
    '',
    'Keys: `h` hint &middot; `space` show answer &middot; `1` clean &middot; `2` needed the hint ' +
      '&middot; `3` missed.',
    '',
    'This is a scratch pad: **nothing is saved**, and each visit reshuffles the deck.',
    'Grading yourself is a far weaker signal than saying an expression unprompted in a',
    'real conversation, so the record that counts is the one the skill keeps in',
    '`chat/chunks.md` and `chat/errors.md` - not anything you click here.',
    '<div id="chatDrillMode" class="chat-filters">' +
      '<button data-m="turn" class="on">整轮复述</button>' +
      '<button data-m="point">单点</button></div>',
    '<div id="chatDrill"></div>',
    '',
    '## Sessions',
    '<div id="chatDays"></div>',
    '',
    '## Chunks Owned',
    '',
    'Expressions you have produced twice, unprompted, in a new context. Chunks still',
    'in circulation are counted but not listed.',
    '<div id="chatChunks"></div>',
    '',
    '## Error Log',
    '',
    'Phrasings you produced, with the natural version. Orange = due for review.',
    '<div id="chatErrFilters" class="chat-filters"></div>',
    '<div id="chatErrors"></div>',
    '',
    '<script>window.CHAT_DATA = ' +
      JSON.stringify(data).replace(/</g, '\\u003c') + ';</script>',
    DASH_SCRIPT,
    '',
  ].join('\n');
  assertScriptParses('chat dashboard', page);
  writeFile(path.join(SOURCE, 'chat', 'index.md'), page);

  const turnCount = days.reduce((n, d) => n + d.turns.length, 0);
  console.log('Imported ' + days.length + ' chat day(s) with ' + turnCount +
    ' exchange(s), ' + chunks.length + ' chunk(s), ' + errors.length +
    ' error(s), ' + cards.length + ' drill card(s).');

  if (problems.length) {
    console.warn('\nchat: ' + problems.length + ' summary/importer mismatch(es).');
    console.warn('The summary format is a contract - see the Machine Contract section of');
    console.warn('english-daily-chat/references/summary-format.md.');
    for (const m of problems) console.warn('  - ' + m);
    console.warn('');
  }
}

main();
