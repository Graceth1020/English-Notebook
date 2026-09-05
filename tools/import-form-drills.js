/**
 * Build the Form Drills section of the site from form/.
 *
 * A form drill is the third track, after the daily chat and the pattern drills,
 * and it exists for one narrow class of error: the ones the learner gets right
 * whenever he is paying attention to them, and drops the moment his attention is
 * on content. Articles scored 12/12 in isolation while accruing five hits in five
 * consecutive chat sessions, which is the whole reason this track exists.
 *
 * So the mechanism is: hard content, and ONLY the form axes marked. See
 * english-daily-chat/references/form-drills.md - that file is the contract this
 * parser implements, and the anchors below must match it exactly.
 *
 * The centrepiece of the page is the difficulty x axis matrix. Individual
 * corrections matter less here than the shape of the curve across rounds: on the
 * first run the curve was inverted, with the hardest round clean and the easiest
 * one carrying the tense error.
 *
 * Standalone by the same reasoning as import-patterns.js: the existing importers
 * each run independently, and sharing helpers would mean touching all of them.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'source');
const POSTS = path.join(SOURCE, '_posts');
const DATA_DIR = path.join(SOURCE, '_data');
const FORM = path.join(ROOT, 'form');

const GENERATED = [
  path.join(POSTS, 'Form'),
  path.join(SOURCE, 'form'),
  path.join(DATA_DIR, 'form.json'),
];

const DRILL_RE = /^form-(\d+)-(\d{8})(?:-[a-z0-9-]+)?\.md$/;

/** Fixed, so results stay comparable across drills. */
const AXES = ['tense', 'article', 'form'];

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

/**
 * An axis line is clean only when it says exactly `ok`. Anything else is a miss
 * and the whole text becomes the correction shown on the page - so a summary
 * cannot accidentally record a miss as clean by being wordy about it.
 */
function axisState(text) {
  const t = (text || '').trim();
  if (!t) return 'none';
  if (/^ok\.?$/i.test(t)) return 'ok';
  return 'miss';
}

/**
 * Parse one form drill. Rounds rather than items: the unit is a whole answer of
 * three or four sentences, marked on three axes.
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
  let section = null;
  let field = null;

  const pushRound = () => {
    if (round) {
      if (!round.zh) {
        complain(base + ' round ' + round.n +
          ': no Chinese cue - produces no recall card.');
      }
      if (!round.you) {
        complain(base + ' round ' + round.n + ': no "**He wrote:**" line.');
      }
      for (const a of AXES) {
        if (!round.axes[a]) {
          complain(base + ' round ' + round.n + ': no "**' + a +
            ':**" line - every axis must be stated, even when clean.');
        }
      }
      rounds.push(round);
    }
    round = null;
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!title && line.startsWith('# ')) { title = line.slice(2).trim(); continue; }

    if (!round && !section && /^Date:/.test(line)) {
      for (const part of line.split('|')) {
        const kv = part.split(':');
        if (kv.length >= 2) {
          meta[kv[0].trim().toLowerCase()] = kv.slice(1).join(':').trim();
        }
      }
      continue;
    }

    let hit;
    if ((hit = /^##\s+Round\s+(\d+)\s*[-\u2013]\s*(.*)$/i.exec(line))) {
      pushRound();
      section = null;
      round = {
        n: +hit[1], difficulty: hit[2].trim(), prompt: '', zh: '', you: '',
        axes: {}, note: '',
      };
      field = null;
      continue;
    }

    if (/^##\s+/.test(line)) {
      pushRound();
      const heading = line.replace(/^##\s+/, '').trim();
      section = { heading, lines: [] };
      sections.push(section);
      field = null;
      continue;
    }

    if (round) {
      if ((hit = /^\*\*Prompt:\*\*\s*(.*)$/.exec(line))) {
        round.prompt = hit[1]; field = 'prompt'; continue;
      }
      if ((hit = /^\*\*\u4e2d\u6587\uff1a\*\*\s*(.*)$/.exec(line))) {
        round.zh = hit[1]; field = 'zh'; continue;
      }
      if (/^\*\*He wrote:\*\*/.test(line)) { field = 'you'; continue; }
      if ((hit = /^\*\*Note:\*\*\s*(.*)$/.exec(line))) {
        round.note = hit[1]; field = 'note'; continue;
      }

      let axisHit = null;
      for (const a of AXES) {
        const re = new RegExp('^\\*\\*' + a + ':\\*\\*\\s*(.*)$', 'i');
        const h = re.exec(line);
        if (h) { axisHit = [a, h[1]]; break; }
      }
      if (axisHit) {
        round.axes[axisHit[0]] = axisHit[1].trim() || 'ok';
        field = 'axis:' + axisHit[0];
        continue;
      }

      if (line === '---') { field = null; continue; }
      if (!line) continue;

      if (field === 'you') {
        const text = line.replace(/^>\s?/, '');
        round.you = round.you ? round.you + ' ' + text : text;
      } else if (field === 'prompt') {
        round.prompt = round.prompt ? round.prompt + ' ' + line : line;
      } else if (field === 'zh') {
        round.zh += line;
      } else if (field === 'note') {
        round.note = round.note ? round.note + ' ' + line : line;
      } else if (field && field.startsWith('axis:')) {
        const a = field.slice(5);
        round.axes[a] = (round.axes[a] + ' ' + line).trim();
      }
      continue;
    }

    if (section) { section.lines.push(raw); continue; }
  }
  pushRound();

  if (!rounds.length) complain(base + ': no "## Round N - label" sections found.');

  // The Matrix section is generated from the parsed axes rather than trusted, so
  // a hand-written table that disagrees with the round bodies is reported.
  const matrixSection = sections.find((s) => /^Matrix$/i.test(s.heading));
  if (matrixSection) {
    for (const line of matrixSection.lines) {
      const c = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|')
        .map((x) => x.trim());
      if (c.length < 5 || !/^\d+$/.test(c[0])) continue;
      const r = rounds.find((x) => x.n === +c[0]);
      if (!r) continue;
      AXES.forEach((a, i) => {
        const stated = axisState(c[i + 2] === 'ok' ? 'ok' : 'x');
        if (stated !== axisState(r.axes[a])) {
          complain(base + ' round ' + r.n + ': Matrix says ' + a + '=' + c[i + 2] +
            ' but the round body says ' + axisState(r.axes[a]) + '.');
        }
      });
    }
  }

  const stem = base.replace(/\.md$/, '');
  let clean = 0;
  let total = 0;
  for (const r of rounds) {
    for (const a of AXES) {
      if (!r.axes[a]) continue;
      total += 1;
      if (axisState(r.axes[a]) === 'ok') clean += 1;
    }
  }

  return {
    stem,
    drill: m[1],
    date: meta.date || fmtDate(m[2]),
    title,
    axes: meta.axes || AXES.join(', '),
    clean,
    total,
    rounds,
    sections: sections.filter((s) => !/^Matrix$/i.test(s.heading))
      .map((s) => ({ heading: s.heading, body: s.lines.join('\n').trim() }))
      .filter((s) => s.body),
  };
}

const STYLE = `
<style>
.fd-meta{display:flex;flex-wrap:wrap;gap:10px;margin:1em 0}
.fd-meta div{border:1px solid #e6eaf2;border-radius:10px;padding:8px 13px;background:#fbfcfe}
.fd-meta b{display:block;font-size:1.15em}
.fd-meta span{font-size:.78em;color:#888;text-transform:uppercase;letter-spacing:.04em}
.fd-mx{width:100%;border-collapse:collapse;margin:1.2em 0;font-size:.93em}
.fd-mx th,.fd-mx td{border:1px solid #eef1f5;padding:8px 10px;text-align:left}
.fd-mx th{font-size:.78em;color:#8a94a6;text-transform:uppercase;letter-spacing:.04em;background:#fbfcfe}
.fd-mx td.ax{text-align:center;font-weight:700}
.fd-mx td.ok{background:#f1fbf4;color:#15803d}
.fd-mx td.miss{background:#fff5f5;color:#b91c1c}
.fd-diff{display:inline-block;font-size:.72em;font-weight:700;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#4338ca}
.fd-round{margin:1.6em 0 .6em;padding:7px 0 0;border-top:2px solid #eef1f5}
.fd-round h3{margin:0 0 .2em;font-size:1.05em}
.fd-card{border:1px solid #e6eaf2;border-radius:12px;padding:13px 15px;margin:11px 0;background:#fff}
.fd-prompt{font-weight:600;margin-bottom:7px;overflow-wrap:anywhere}
.fd-cue{background:#f6f8fc;border-left:3px solid #b9c6de;padding:7px 11px;border-radius:0 8px 8px 0;margin:7px 0}
.fd-cue .lead{display:block;font-size:.75em;color:#8a94a6;letter-spacing:.05em}
.fd-hold{display:flex;align-items:center;gap:10px;margin-top:9px;flex-wrap:wrap}
.fd-hold button{padding:5px 14px;border:1px solid #cfd8e8;border-radius:999px;background:#fff;color:#243;cursor:pointer;font:inherit;font-size:.85em}
.fd-hold small{color:#8a94a6}
.fd-ans{margin-top:10px;border-top:1px dashed #dbe3ef;padding-top:10px}
.fd-lab{font-size:.75em;color:#8a94a6;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
.fd-you{background:#fff9ed;border-left:3px solid #e8c680;padding:6px 10px;border-radius:0 7px 7px 0;overflow-wrap:anywhere}
.fd-ax{margin-top:10px}
.fd-ax div{padding:5px 0;border-top:1px solid #f2f5fa;overflow-wrap:anywhere}
.fd-ax div:first-child{border-top:0}
.fd-pill{display:inline-block;min-width:62px;font-size:.72em;font-weight:700;padding:2px 8px;border-radius:999px;margin-right:8px;text-align:center}
.fd-pill.ok{background:#dcfce7;color:#15803d}
.fd-pill.miss{background:#fee2e2;color:#b91c1c}
.fd-note{font-size:.9em;color:#5b6472;margin-top:9px;padding:7px 10px;background:#f6f8fc;border-radius:8px;overflow-wrap:anywhere}
.fd-toolbar{display:flex;align-items:center;gap:11px;flex-wrap:wrap;margin:1.1em 0 .4em}
.fd-toggle{padding:5px 13px;border:1px solid #cfd8e8;border-radius:999px;background:#fff;color:#243;cursor:pointer;font:inherit;font-size:.85em}
.fd-tip{color:#8a94a6}
.fd-tbl{width:100%;border-collapse:collapse;margin:1em 0;font-size:.93em}
.fd-tbl th,.fd-tbl td{border-bottom:1px solid #eef1f5;padding:7px 9px;text-align:left;vertical-align:top}
.fd-tbl th{font-size:.78em;color:#8a94a6;text-transform:uppercase;letter-spacing:.04em}
html[data-theme="dark"] .fd-meta div{background:#1b1f27;border-color:#2b323d}
html[data-theme="dark"] .fd-card{background:#171a20;border-color:#2b323d}
html[data-theme="dark"] .fd-cue,html[data-theme="dark"] .fd-note{background:#1b1f27;border-left-color:#39414e}
html[data-theme="dark"] .fd-hold button,html[data-theme="dark"] .fd-toggle{background:#1b1f27;border-color:#39414e;color:#dfe4ec}
html[data-theme="dark"] .fd-you{background:#2a2318}
html[data-theme="dark"] .fd-round{border-top-color:#2b323d}
html[data-theme="dark"] .fd-mx th{background:#1b1f27}
html[data-theme="dark"] .fd-mx th,html[data-theme="dark"] .fd-mx td{border-color:#2b323d}
html[data-theme="dark"] .fd-mx td.ok{background:#16251c}
html[data-theme="dark"] .fd-mx td.miss{background:#2a1d1f}
html[data-theme="dark"] .fd-ax div{border-top-color:#252b34}
html[data-theme="dark"] .fd-tbl th,html[data-theme="dark"] .fd-tbl td{border-bottom-color:#2b323d}
</style>
`;

const SCRIPT = `
<script>
(function(){
  var root = document.getElementById('fd');
  if (!root) return;
  function setOne(card, open){
    var ans = card.querySelector('.fd-ans');
    var btn = card.querySelector('[data-fd="show"]');
    if (!ans || !btn) return;
    ans.hidden = !open;
    btn.textContent = open ? '\u6536\u8d77' : '\u770b\u6279\u6ce8';
  }
  root.addEventListener('click', function(ev){
    var btn = ev.target.closest('[data-fd="show"]');
    if (!btn) return;
    var card = btn.closest('.fd-card');
    setOne(card, card.querySelector('.fd-ans').hidden);
  });
  var all = document.getElementById('fdAll');
  if (all){
    all.addEventListener('click', function(){
      var cards = [].slice.call(root.querySelectorAll('.fd-card'));
      var anyHidden = cards.some(function(c){
        var a = c.querySelector('.fd-ans'); return a && a.hidden;
      });
      cards.forEach(function(c){ setOne(c, anyHidden); });
      all.textContent = anyHidden ? '\u5168\u90e8\u6536\u8d77' : '\u5168\u90e8\u5c55\u5f00';
    });
  }
})();
</script>
`;

/** The matrix is the point of the page, so it is rendered first. */
function renderMatrix(d) {
  const head = '<tr><th>Round</th><th>Difficulty</th>' +
    AXES.map((a) => '<th>' + esc(a) + '</th>').join('') + '</tr>';
  const body = d.rounds.map((r) => {
    const cells = AXES.map((a) => {
      const st = axisState(r.axes[a]);
      if (st === 'none') return '<td class="ax">&mdash;</td>';
      return '<td class="ax ' + st + '">' + (st === 'ok' ? 'ok' : 'miss') + '</td>';
    }).join('');
    return '<tr><td>' + esc(r.n) + '</td><td><span class="fd-diff">' +
      esc(r.difficulty) + '</span></td>' + cells + '</tr>';
  }).join('\n');
  return '<table class="fd-mx"><thead>' + head + '</thead><tbody>\n' +
    body + '\n</tbody></table>';
}

function renderRound(r) {
  const out = [];
  out.push('<div class="fd-round"><h3>Round ' + esc(r.n) + ' &middot; ' +
    '<span class="fd-diff">' + esc(r.difficulty) + '</span></h3></div>');
  out.push('<div class="fd-card">');
  out.push('<div class="fd-prompt">' + inline(r.prompt) + '</div>');
  out.push('<div class="fd-cue"><span class="lead">' +
    '\u8981\u56de\u7b54\u7684\u662f' + '</span>' +
    inline(r.zh || '(no cue)') + '</div>');
  out.push('<div class="fd-hold">' +
    '<button type="button" data-fd="show">\u770b\u6279\u6ce8</button>' +
    '<small>\u5148\u81ea\u5df1\u5199\u4e09\u56db\u53e5\uff0c\u518d\u5bf9\u7167' +
    '</small></div>');
  out.push('<div class="fd-ans" hidden>');
  if (r.you) {
    out.push('<div class="fd-lab">He wrote</div>');
    out.push('<div class="fd-you">' + inline(r.you) + '</div>');
  }
  out.push('<div class="fd-ax">');
  for (const a of AXES) {
    const txt = r.axes[a];
    if (!txt) continue;
    const st = axisState(txt);
    out.push('<div><span class="fd-pill ' + st + '">' + esc(a) + '</span>' +
      inline(st === 'ok' ? 'ok' : txt) + '</div>');
  }
  out.push('</div>');
  if (r.note) {
    out.push('<div class="fd-note"><b>Not counted:</b> ' + inline(r.note) + '</div>');
  }
  out.push('</div></div>');
  return out.join('\n');
}

function renderDrill(d) {
  const parts = [];
  parts.push('<div class="fd-meta">' +
    '<div><b>' + esc(d.rounds.length) + '</b><span>rounds</span></div>' +
    '<div><b>' + esc(d.clean) + '/' + esc(d.total) + '</b><span>clean</span></div>' +
    '<div><b>' + esc(d.axes) + '</b><span>axes</span></div>' +
    '</div>');
  parts.push(renderMatrix(d));
  parts.push('<div class="fd-toolbar">' +
    '<button type="button" id="fdAll" class="fd-toggle">\u5168\u90e8\u5c55\u5f00' +
    '</button><small class="fd-tip">' +
    '\u6279\u6ce8\u9ed8\u8ba4\u6298\u53e0\uff0c\u65b9\u4fbf\u91cd\u505a' +
    '</small></div>');
  parts.push('<div id="fd">');
  for (const r of d.rounds) parts.push(renderRound(r));
  parts.push('</div>');
  return parts.join('\n');
}

function buildCards(drills) {
  const cards = [];
  for (const d of drills) {
    for (const r of d.rounds) {
      if (!r.zh || !r.you) continue;
      cards.push({
        key: 'F' + d.drill + '.' + r.n,
        drill: d.drill,
        round: r.n,
        difficulty: r.difficulty,
        cue: r.zh,
        prompt: r.prompt,
        said: r.you,
        axes: AXES.reduce((o, a) => {
          if (r.axes[a]) o[a] = { state: axisState(r.axes[a]), text: r.axes[a] };
          return o;
        }, {}),
        url: d.url,
      });
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
  if (!fs.existsSync(FORM)) {
    console.log('No form/ directory; nothing to import.');
    return;
  }

  const dir = path.join(FORM, 'summaries');
  const drills = [];
  for (const base of readDirFiles(dir)) {
    const parsed = parseDrill(dir, base);
    if (parsed) drills.push(parsed);
  }
  drills.sort((a, b) => parseInt(a.drill, 10) - parseInt(b.drill, 10));

  const root = siteRoot().endsWith('/') ? siteRoot() : siteRoot() + '/';
  const meta = [];
  for (const d of drills) {
    d.url = root + 'form/drills/' + d.stem + '/';
    meta.push({
      drill: d.drill, date: d.date, title: d.title, axes: d.axes,
      rounds: d.rounds.length, clean: d.clean, total: d.total, url: d.url,
    });

    const body = [STYLE, renderDrill(d), SCRIPT];
    for (const s of d.sections) body.push('', '## ' + s.heading, '', s.body);
    const html = body.join('\n');
    assertScriptParses(d.stem, html);

    writeFile(
      path.join(POSTS, 'Form', d.stem + '.md'),
      frontmatter({
        title: d.title,
        date: d.date + ' 22:' + String(parseInt(d.drill, 10) % 60).padStart(2, '0') + ':00',
        permalink: 'form/drills/' + d.stem + '/',
        form_drill: d.drill,
      }) + '\n\n' + html + '\n'
    );
  }

  const cards = buildCards(drills);

  writeFile(path.join(DATA_DIR, 'form.json'),
    JSON.stringify({
      generated: new Date().toISOString(),
      axes: AXES, drills: meta.slice().reverse(), cards,
    }, null, 2) + '\n');

  // Index: one combined matrix across every drill, because the comparison
  // between drills is the thing this track is for.
  const head = '<tr><th>Drill</th><th>Round</th><th>Difficulty</th>' +
    AXES.map((a) => '<th>' + esc(a) + '</th>').join('') + '</tr>';
  const rows = [];
  for (const d of drills) {
    for (const r of d.rounds) {
      const cells = AXES.map((a) => {
        const st = axisState(r.axes[a]);
        if (st === 'none') return '<td class="ax">&mdash;</td>';
        return '<td class="ax ' + st + '">' + (st === 'ok' ? 'ok' : 'miss') + '</td>';
      }).join('');
      rows.push('<tr><td><a href="' + d.url + '">' + esc(d.drill) + '</a></td>' +
        '<td>' + esc(r.n) + '</td>' +
        '<td><span class="fd-diff">' + esc(r.difficulty) + '</span></td>' +
        cells + '</tr>');
    }
  }

  const list = meta.map((d) =>
    '- [' + esc(d.title) + '](' + d.url + ') &middot; ' + esc(d.date) +
    ' &middot; ' + esc(d.rounds) + ' rounds &middot; ' +
    esc(d.clean) + '/' + esc(d.total) + ' clean').join('\n');

  writeFile(path.join(SOURCE, 'form', 'index.md'),
    frontmatter({ title: 'Form Drills', layout: 'page' }) + '\n\n' + [
      STYLE,
      'The third track. It exists for one narrow class of error: the ones that are',
      '**correct under attention and wrong under production**. Articles scored',
      '12/12 in an isolated drill while accruing five hits in five consecutive chat',
      'sessions - so the gap is not knowledge, it is attention.',
      '',
      'The mechanism is therefore the opposite of a normal drill: a question whose',
      '*content* takes real thinking, three or four sentences to answer, and only',
      'the form axes marked. Word choice, register and idiom are ignored here.',
      '**The axes are never announced during the drill** - naming them restores the',
      'attention the drill is trying to occupy.',
      '',
      '## Every Round, Every Axis',
      '',
      'Difficulty climbs within each drill. The shape of the curve is the finding:',
      'on the first run it was *inverted*, with the hardest round clean and the',
      'easiest one carrying the error.',
      '',
      '<table class="fd-mx"><thead>' + head + '</thead><tbody>',
      rows.length ? rows.join('\n') :
        '<tr><td colspan="' + (AXES.length + 3) + '">Nothing logged yet.</td></tr>',
      '</tbody></table>',
      '',
      '## Drills',
      '',
      list || '_No drills yet._',
      '',
    ].join('\n'));

  console.log('Imported ' + drills.length + ' form drill(s) with ' +
    cards.length + ' round card(s).');

  if (problems.length) {
    console.log('\nForm drill import warnings:');
    for (const p of problems) console.log('  - ' + p);
  }
}

main();
