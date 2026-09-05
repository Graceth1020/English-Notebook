/**
 * Build the Patterns section of the site from patterns/.
 *
 * A pattern drill is a second, separate track from the daily chat: one sentence
 * structure at a time, drilled explicitly because seeding cannot reach it. See
 * english-daily-chat/references/pattern-drills.md - that file is the contract
 * this parser implements, and the anchors below must match it exactly.
 *
 * Deliberately standalone. It duplicates a handful of small helpers from
 * import-chat.js rather than sharing them, because the three existing importers
 * already run independently and introducing a shared module would mean touching
 * all of them at once.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'source');
const POSTS = path.join(SOURCE, '_posts');
const DATA_DIR = path.join(SOURCE, '_data');
const PATTERNS = path.join(ROOT, 'patterns');

const GENERATED = [
  path.join(POSTS, 'Patterns'),
  path.join(SOURCE, 'patterns'),
  path.join(DATA_DIR, 'patterns.json'),
];

const DRILL_RE = /^pattern-(\d+)-(\d{8})\.md$/;

const problems = [];
function complain(msg) { problems.push(msg); }

function readText(p) { return fs.readFileSync(p, 'utf8'); }

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
  return yyyymmdd.slice(0, 4) + '-' + yyyymmdd.slice(4, 6) + '-' +
    yyyymmdd.slice(6, 8);
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

function inline(s) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return t;
}

function cellsOf(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '')
    .split('|').map((c) => c.trim().replace(/\\\|/g, '|'));
}

/** The inventory table: one row per known structural gap. */
function parseInventory() {
  const file = path.join(PATTERNS, 'inventory.md');
  if (!fs.existsSync(file)) return [];
  const keys = ['id', 'pattern', 'gap', 'example', 'found', 'drills', 'used',
    'status', 'next'];
  const out = [];
  for (const line of readText(file).split(/\r?\n/)) {
    if (!/^\|\s*P\d+\s*\|/.test(line)) continue;
    const c = cellsOf(line);
    const row = {};
    keys.forEach((k, i) => { row[k] = c[i] || ''; });
    out.push(row);
  }
  return out;
}

/**
 * Parse one drill summary into rounds of items.
 *
 * Anchors, all literal: `## Round <n> - <name>`, `**<n>.**`, the Chinese cue,
 * `**You wrote:**`, `**Answer:**`, `**Verdict:**`, `**Why:**`, and `---` as the
 * item separator.
 */
function parseDrill(dir, base) {
  const m = DRILL_RE.exec(base);
  if (!m) return null;
  const lines = readText(path.join(dir, base)).split(/\r?\n/);

  let title = '';
  const meta = {};
  const rounds = [];
  const sections = [];
  let round = null;
  let item = null;
  let section = null;
  let field = null;

  const pushItem = () => {
    if (item && item.n) {
      if (!item.zh) {
        complain(base + ' item ' + item.n +
          ': no Chinese cue - produces no drill card.');
      }
      if (!item.answer) {
        complain(base + ' item ' + item.n + ': no "**Answer:**" line.');
      }
      round.items.push(item);
    }
    item = null;
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!title && line.startsWith('# ')) { title = line.slice(2).trim(); continue; }

    if (!round && !section && /^Date:/.test(line)) {
      for (const part of line.split('|')) {
        const kv = /^\s*([^:]+):\s*(.*)$/.exec(part);
        if (kv) meta[kv[1].trim().toLowerCase()] = kv[2].trim();
      }
      continue;
    }

    let hit;
    if ((hit = /^##\s+Round\s+(\d+)\s*[-\u2013]\s*(.*)$/i.exec(line))) {
      pushItem();
      round = { n: +hit[1], name: hit[2].trim(), items: [] };
      rounds.push(round);
      section = null;
      field = null;
      continue;
    }
    if (line.startsWith('## ')) {
      pushItem();
      round = null;
      section = { heading: line.slice(3).trim(), lines: [] };
      sections.push(section);
      field = null;
      continue;
    }

    if (round) {
      if (line === '---') { pushItem(); field = null; continue; }
      if ((hit = /^\*\*(\d+)\.\*\*\s*(.*)$/.exec(line))) {
        pushItem();
        item = { n: +hit[1], task: hit[2], zh: '', you: '', answer: '',
          verdict: '', why: '' };
        field = 'task';
        continue;
      }
      if ((hit = /^\*\*\u4e2d\u6587\uff1a\*\*\s*(.*)$/.exec(line))) {
        if (item) { item.zh = hit[1]; field = 'zh'; }
        continue;
      }
      if (/^\*\*You wrote:\*\*/.test(line)) { field = 'you'; continue; }
      if (/^\*\*Answer:\*\*/.test(line)) { field = 'answer'; continue; }
      if ((hit = /^\*\*Verdict:\*\*\s*(.*)$/.exec(line))) {
        if (item) item.verdict = hit[1];
        field = null;
        continue;
      }
      if ((hit = /^\*\*Why:\*\*\s*(.*)$/.exec(line))) {
        if (item) item.why = hit[1];
        field = 'why';
        continue;
      }
      if (!line || !item) continue;
      const text = line.replace(/^>\s?/, '');
      if (field === 'you' || field === 'answer' || field === 'task') {
        item[field] = item[field] ? item[field] + ' ' + text : text;
      } else if (field === 'zh') {
        item.zh += text;
      } else if (field === 'why') {
        item.why = item.why ? item.why + ' ' + text : text;
      }
      continue;
    }

    if (section) section.lines.push(raw);
  }
  pushItem();

  if (!rounds.length) complain(base + ': no "## Round N - name" sections found.');

  const items = rounds.reduce((n, r) => n + r.items.length, 0);
  const stem = base.replace(/\.md$/, '');
  return {
    stem,
    drill: m[1],
    date: meta.date || fmtDate(m[2]),
    title,
    patternId: meta.pattern || '',
    structure: title.replace(/^Pattern\s+\d+\s*[-\u2013]\s*/i, '').trim() || stem,
    itemsStated: +(meta.items || 0) || 0,
    correct: meta.correct || '',
    rounds,
    items,
    sections: sections
      .map((s) => ({ heading: s.heading, body: s.lines.join('\n').trim() }))
      .filter((s) => s.body),
  };
}

const STYLE = `
<style>
.pt-meta{display:flex;flex-wrap:wrap;gap:10px;margin:1em 0}
.pt-meta div{border:1px solid #e6eaf2;border-radius:10px;padding:8px 13px;background:#fbfcfe}
.pt-meta b{display:block;font-size:1.15em}
.pt-meta span{font-size:.78em;color:#888;text-transform:uppercase;letter-spacing:.04em}
.pt-round{margin:1.6em 0 .6em;padding:7px 0 0;border-top:2px solid #eef1f5}
.pt-round h3{margin:0 0 .2em;font-size:1.05em}
.pt-round small{color:#8a94a6}
.pt-item{border:1px solid #e6eaf2;border-radius:12px;padding:13px 15px;margin:11px 0;background:#fff}
.pt-task{font-weight:600;margin-bottom:7px}
.pt-cue{background:#f6f8fc;border-left:3px solid #b9c6de;padding:7px 11px;border-radius:0 8px 8px 0;margin:7px 0}
.pt-cue .lead{display:block;font-size:.75em;color:#8a94a6;letter-spacing:.05em}
.pt-hold{display:flex;align-items:center;gap:10px;margin-top:9px;flex-wrap:wrap}
.pt-hold button{padding:5px 14px;border:1px solid #cfd8e8;border-radius:999px;background:#fff;color:#243;cursor:pointer;font:inherit;font-size:.85em}
.pt-hold small{color:#8a94a6}
.pt-ans{margin-top:10px;border-top:1px dashed #dbe3ef;padding-top:10px}
.pt-lab{font-size:.75em;color:#8a94a6;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
.pt-you{background:#fff5f5;border-left:3px solid #f3b6b6;padding:6px 10px;border-radius:0 7px 7px 0;overflow-wrap:anywhere}
.pt-good{background:#f1fbf4;border-left:3px solid #93d6ab;padding:6px 10px;border-radius:0 7px 7px 0;overflow-wrap:anywhere}
.pt-why{font-size:.9em;color:#5b6472;margin-top:7px;overflow-wrap:anywhere}
.pt-v{display:inline-block;font-size:.72em;font-weight:700;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#4338ca}
.pt-v.ok{background:#dcfce7;color:#15803d}
.pt-v.wrong{background:#fee2e2;color:#b91c1c}
.pt-v.not{background:#ffedd5;color:#c2410c}
.pt-toolbar{display:flex;align-items:center;gap:11px;flex-wrap:wrap;margin:1.1em 0 .4em}
.pt-toggle{padding:5px 13px;border:1px solid #cfd8e8;border-radius:999px;background:#fff;color:#243;cursor:pointer;font:inherit;font-size:.85em}
.pt-tip{color:#8a94a6}
.pt-tbl{width:100%;border-collapse:collapse;margin:1em 0;font-size:.93em}
.pt-tbl th,.pt-tbl td{border-bottom:1px solid #eef1f5;padding:7px 9px;text-align:left;vertical-align:top}
.pt-tbl th{font-size:.78em;color:#8a94a6;text-transform:uppercase;letter-spacing:.04em}
.pt-st{display:inline-block;font-size:.72em;font-weight:700;padding:2px 8px;border-radius:999px}
.pt-st.open{background:#f1f5f9;color:#64748b}
.pt-st.drilled{background:#fef9c3;color:#a16207}
.pt-st.owned{background:#dcfce7;color:#15803d}
html[data-theme="dark"] .pt-meta div{background:#1b1f27;border-color:#2b323d}
html[data-theme="dark"] .pt-item{background:#171a20;border-color:#2b323d}
html[data-theme="dark"] .pt-cue{background:#1b1f27;border-left-color:#39414e}
html[data-theme="dark"] .pt-hold button,html[data-theme="dark"] .pt-toggle{background:#1b1f27;border-color:#39414e;color:#dfe4ec}
html[data-theme="dark"] .pt-you{background:#2a1d1f}
html[data-theme="dark"] .pt-good{background:#16251c}
html[data-theme="dark"] .pt-round{border-top-color:#2b323d}
html[data-theme="dark"] .pt-tbl th,html[data-theme="dark"] .pt-tbl td{border-bottom-color:#2b323d}
</style>
`;

const SCRIPT = `
<script>
(function(){
  var root = document.getElementById('pt');
  if (!root) return;
  function setOne(card, open){
    var ans = card.querySelector('.pt-ans');
    var btn = card.querySelector('[data-pt="show"]');
    if (!ans || !btn) return;
    ans.hidden = !open;
    btn.textContent = open ? '\u6536\u8d77' : '\u770b\u7b54\u6848';
  }
  root.addEventListener('click', function(ev){
    var btn = ev.target.closest('[data-pt="show"]');
    if (!btn) return;
    var card = btn.closest('.pt-item');
    setOne(card, card.querySelector('.pt-ans').hidden);
  });
  var all = document.getElementById('ptAll');
  if (all){
    all.addEventListener('click', function(){
      var cards = [].slice.call(root.querySelectorAll('.pt-item'));
      var anyHidden = cards.some(function(c){
        var a = c.querySelector('.pt-ans'); return a && a.hidden;
      });
      cards.forEach(function(c){ setOne(c, anyHidden); });
      all.textContent = anyHidden ? '\u5168\u90e8\u6536\u8d77' : '\u5168\u90e8\u5c55\u5f00';
    });
  }
})();
</script>
`;

function verdictClass(v) {
  const s = (v || '').toLowerCase();
  if (/^ok\b|^correct\b/.test(s)) return 'ok';
  if (/^wrong/.test(s)) return 'wrong';
  if (/^not/.test(s)) return 'not';
  return '';
}

function renderItem(it, roundN) {
  const out = [];
  out.push('<div class="pt-item">');
  out.push('<div class="pt-task">' + esc(roundN) + '.' + esc(it.n) + '&nbsp; ' +
    inline(it.task) + '</div>');
  out.push('<div class="pt-cue"><span class="lead">' +
    '\u76ee\u6807\u53e5\u7684\u610f\u601d</span>' +
    inline(it.zh || '(no cue)') + '</div>');
  out.push('<div class="pt-hold">' +
    '<button type="button" data-pt="show">\u770b\u7b54\u6848</button>' +
    '<small>\u5148\u81ea\u5df1\u5199\u4e00\u9047\uff0c\u518d\u5bf9\u7167</small>' +
    '</div>');
  out.push('<div class="pt-ans" hidden>');
  if (it.you) {
    out.push('<div class="pt-lab">You wrote</div>');
    out.push('<div class="pt-you">' + inline(it.you) + '</div>');
  }
  out.push('<div class="pt-lab" style="margin-top:9px">Answer</div>');
  out.push('<div class="pt-good">' + inline(it.answer) + '</div>');
  if (it.verdict) {
    out.push('<div style="margin-top:9px"><span class="pt-v ' +
      verdictClass(it.verdict) + '">' + esc(it.verdict) + '</span></div>');
  }
  if (it.why) out.push('<div class="pt-why">' + inline(it.why) + '</div>');
  out.push('</div></div>');
  return out.join('\n');
}

function renderDrill(d) {
  const parts = [];
  parts.push('<div class="pt-meta">' +
    '<div><b>' + esc(d.rounds.length) + '</b><span>rounds</span></div>' +
    '<div><b>' + esc(d.items) + '</b><span>items</span></div>' +
    (d.correct ? '<div><b>' + esc(d.correct) + '</b><span>correct</span></div>' : '') +
    (d.patternId ? '<div><b>' + esc(d.patternId) + '</b><span>pattern</span></div>' : '') +
    '</div>');
  parts.push('<div class="pt-toolbar">' +
    '<button type="button" id="ptAll" class="pt-toggle">\u5168\u90e8\u5c55\u5f00</button>' +
    '<small class="pt-tip">\u5148\u770b\u63d0\u793a\u81ea\u5df1\u5199\uff0c' +
    '\u518d\u70b9\u5f00\u5bf9\u7b54\u6848\u3002</small></div>');
  parts.push('<div id="pt">');
  for (const r of d.rounds) {
    parts.push('<div class="pt-round"><h3>Round ' + esc(r.n) + ' \u2014 ' +
      inline(r.name) + '</h3><small>' + esc(r.items.length) +
      ' items</small></div>');
    for (const it of r.items) parts.push(renderItem(it, r.n));
  }
  parts.push('</div>');
  return parts.join('\n');
}

function buildCards(drills) {
  const cards = [];
  for (const d of drills) {
    for (const r of d.rounds) {
      for (const it of r.items) {
        if (!it.zh || !it.answer) continue;
        cards.push({
          key: 'D' + d.drill + '.' + r.n + '.' + it.n,
          drill: d.drill,
          pattern: d.patternId,
          round: r.n,
          roundName: r.name,
          cue: it.zh,
          task: it.task,
          answer: it.answer,
          said: it.you,
          verdict: it.verdict,
          why: it.why,
          url: d.url,
        });
      }
    }
  }
  return cards;
}

function assertScriptParses(label, html) {
  const bodies = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  for (const body of bodies) {
    try { new Function(body); } catch (err) {
      throw new Error(label + ': generated script does not parse -> ' + err.message);
    }
  }
}

function main() {
  ensureClean();
  if (!fs.existsSync(PATTERNS)) {
    console.log('No patterns/ directory; nothing to import.');
    return;
  }

  const dir = path.join(PATTERNS, 'summaries');
  const drills = [];
  for (const base of readDirFiles(dir)) {
    const parsed = parseDrill(dir, base);
    if (parsed) drills.push(parsed);
  }
  drills.sort((a, b) => parseInt(a.drill, 10) - parseInt(b.drill, 10));

  for (const d of drills) {
    if (d.itemsStated && d.items !== d.itemsStated) {
      complain(d.stem + ': header says ' + d.itemsStated + ' items but ' +
        d.items + ' parsed.');
    }
  }

  const root = siteRoot().endsWith('/') ? siteRoot() : siteRoot() + '/';
  const meta = [];
  for (const d of drills) {
    d.url = root + 'patterns/drills/' + d.stem + '/';
    meta.push({
      drill: d.drill, date: d.date, title: d.title, structure: d.structure,
      pattern: d.patternId, rounds: d.rounds.length, items: d.items,
      correct: d.correct, url: d.url,
    });

    const body = [STYLE, renderDrill(d), SCRIPT];
    for (const s of d.sections) body.push('', '## ' + s.heading, '', s.body);
    const html = body.join('\n');
    assertScriptParses(d.stem, html);

    writeFile(
      path.join(POSTS, 'Patterns', 'Drills', d.stem + '.md'),
      frontmatter({
        title: d.title,
        date: d.date + ' 21:' + String(parseInt(d.drill, 10) % 60).padStart(2, '0') + ':00',
        permalink: 'patterns/drills/' + d.stem + '/',
        pattern_id: d.patternId,
        pattern_drill: d.drill,
      }) + '\n\n' + html + '\n'
    );
  }

  const inventory = parseInventory();
  const cards = buildCards(drills);

  writeFile(path.join(DATA_DIR, 'patterns.json'),
    JSON.stringify({
      generated: new Date().toISOString(),
      drills: meta.slice().reverse(), inventory, cards,
    }, null, 2) + '\n');

  // Index page: the inventory table plus a list of drills.
  const rows = inventory.map((r) =>
    '<tr><td><code>' + esc(r.id) + '</code></td>' +
    '<td><b>' + inline(r.pattern) + '</b><br><small>' + inline(r.gap) + '</small></td>' +
    '<td>' + esc(r.drills) + '</td>' +
    '<td>' + esc(r.used) + '/2</td>' +
    '<td><span class="pt-st ' + esc((r.status || '').toLowerCase()) + '">' +
      esc(r.status) + '</span></td>' +
    '<td>' + esc(r.next) + '</td></tr>').join('\n');

  const list = meta.map((d) =>
    '- [' + esc(d.title) + '](' + d.url + ') &middot; ' + esc(d.date) +
    ' &middot; ' + esc(d.items) + ' items' +
    (d.correct ? ' &middot; ' + esc(d.correct) + ' correct' : '')).join('\n');

  writeFile(path.join(SOURCE, 'patterns', 'index.md'),
    frontmatter({ title: 'Patterns', layout: 'page' }) + '\n\n' + [
      STYLE,
      'Sentence structures drilled one at a time. Separate from the daily chat:',
      'a pattern cannot be seeded into a conversation, because any idea it',
      'expresses can be said correctly with ordinary clauses - so there is',
      'nothing to correct when it is avoided, only something missing.',
      '',
      '**`drilled` is not `owned`.** A drill is recognition practice: the',
      'structure was available while it was the announced subject. Promotion to',
      '`owned` needs two unprompted uses in a normal chat session.',
      '',
      '## Inventory',
      '',
      '<table class="pt-tbl"><thead><tr><th>ID</th><th>Pattern</th>' +
        '<th>Drills</th><th>Unprompted</th><th>Status</th><th>Next</th></tr>' +
        '</thead><tbody>',
      rows || '<tr><td colspan="6">Nothing logged yet.</td></tr>',
      '</tbody></table>',
      '',
      '## Drills',
      '',
      list || '_No drills yet._',
      '',
    ].join('\n'));

  console.log('Imported ' + drills.length + ' pattern drill(s) with ' +
    cards.length + ' item card(s), ' + inventory.length + ' inventory row(s).');

  if (problems.length) {
    console.log('\nPattern import warnings:');
    for (const p of problems) console.log('  - ' + p);
  }
}

main();
