// Import form/chunks/*.md (scene chunk library from the action-chain drills)
// into an interactive recall page at /form/chunks/.
//
// Scene files are hand-maintained markdown: `## <scene>（<source>）` sections,
// each with an optional **原句：** blockquote, an optional **优化版（背诵用）：**
// blockquote, and a chunk table (| Chunk | 中文/用法 | 状态 |, status column
// optional). Any other `##` section (e.g. 背诵方式) is rendered as a note.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHUNKS = path.join(ROOT, 'form', 'chunks');
const SOURCE = path.join(ROOT, 'source');

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}
function frontmatter(fields) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) lines.push(k + ': ' + v);
  lines.push('---');
  return lines.join('\n');
}
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseSceneFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const titleM = text.match(/^# (.+)$/m);
  const title = titleM ? titleM[1].trim() : path.basename(file, '.md');
  const lines = text.split(/\r?\n/);

  const sections = [];
  let cur = null;
  const flush = () => { if (cur) sections.push(cur); };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      flush();
      const m = h2[1].match(/^(.+?)（(.+?)）\s*$/);
      cur = { name: m ? m[1].trim() : h2[1].trim(), src: m ? m[2].trim() : '',
              original: '', optimized: '', chunks: [], notes: [] };
      continue;
    }
    if (!cur || /^# /.test(line)) continue;

    if (/^\*\*原句：\*\*/.test(line)) {
      const q = [];
      while (i + 1 < lines.length && /^>\s?/.test(lines[i + 1])) q.push(lines[++i].replace(/^>\s?/, ''));
      cur.original = q.join(' ');
      continue;
    }
    if (/^\*\*优化版（背诵用）：\*\*/.test(line)) {
      const q = [];
      while (i + 1 < lines.length && /^>\s?/.test(lines[i + 1])) q.push(lines[++i].replace(/^>\s?/, ''));
      cur.optimized = q.join(' ');
      continue;
    }
    if (/^\|/.test(line)) {
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (!cells.length || /^-+$/.test(cells[0].replace(/\s/g, '')) || cells[0] === 'Chunk') continue;
      const status = cells[2] || '';
      let kind = '', original = '';
      if (/^✅/.test(status)) kind = 'produced';
      else if (/^纠错/.test(status)) { kind = 'corrected'; original = status.replace(/^纠错[：:]\s*/, ''); }
      else if (/词库补充/.test(status)) kind = 'supplied';
      cur.chunks.push({ chunk: cells[0], cue: cells[1] || '', kind, original });
      continue;
    }
    if (line.trim() && !/^\*\*/.test(line)) cur.notes.push(line.trim());
  }
  flush();
  return { title, sections };
}

const STYLE = `
<style>
.fc-meta{display:flex;flex-wrap:wrap;gap:10px;margin:1em 0}
.fc-meta div{border:1px solid #e6eaf2;border-radius:10px;padding:8px 13px;background:#fbfcfe}
.fc-meta b{display:block;font-size:1.15em}
.fc-meta span{font-size:.78em;color:#888;text-transform:uppercase;letter-spacing:.04em}
.fc-scene{margin:1.8em 0 .6em;padding-top:10px;border-top:2px solid #eef1f5}
.fc-scene h3{margin:0 0 .2em;font-size:1.08em}
.fc-src{font-size:.78em;color:#8a94a6}
.fc-pass{margin:8px 0}
.fc-pass summary{cursor:pointer;font-size:.88em;color:#4338ca;font-weight:600}
.fc-pass blockquote{margin:6px 0;padding:8px 12px;border-left:3px solid #b9c6de;background:#f6f8fc;border-radius:0 8px 8px 0}
.fc-pass.opt blockquote{border-left-color:#5cb88a;background:#f1fbf4}
.fc-note{font-size:.85em;color:#667;background:#fbfcfe;border:1px dashed #dbe3ef;border-radius:8px;padding:8px 12px;margin:8px 0}
.fc-card{border:1px solid #e6eaf2;border-radius:12px;padding:12px 15px;margin:10px 0;background:#fff}
.fc-cue{font-weight:600;overflow-wrap:anywhere}
.fc-hold{display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap}
.fc-hold button{padding:5px 14px;border:1px solid #cfd8e8;border-radius:999px;background:#fff;color:#243;cursor:pointer;font:inherit;font-size:.85em}
.fc-ans{margin-top:9px;border-top:1px dashed #dbe3ef;padding-top:9px}
.fc-chunk{font-size:1.08em;font-weight:700;overflow-wrap:anywhere}
.fc-tag{display:inline-block;font-size:.72em;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:8px;vertical-align:middle}
.fc-tag.produced{background:#eafaf0;color:#15803d}
.fc-tag.corrected{background:#fff5f5;color:#b91c1c}
.fc-tag.supplied{background:#eef2ff;color:#4338ca}
.fc-orig{font-size:.85em;color:#8a94a6;margin-top:4px}
.fc-orig s{color:#b91c1c}
.fc-all{margin:0 0 14px;padding:6px 16px;border:1px solid #cfd8e8;border-radius:999px;background:#fff;color:#243;cursor:pointer;font:inherit;font-size:.88em}
.fc-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:1.4em 0 0;border-bottom:2px solid #e3e8ef}
.fc-tabs button{padding:8px 16px;border:1px solid #dbe3ef;border-bottom:0;border-radius:10px 10px 0 0;background:#f8fafc;color:#5b6675;cursor:pointer;font:inherit;font-size:.92em;margin-bottom:-2px}
.fc-tabs button:hover{color:#2563eb;background:#fff}
.fc-tabs button.on{background:#fff;color:#2563eb;font-weight:600;border-bottom:2px solid #fff}
.fc-count{font-size:.78em;color:#98a2b3;margin-left:5px}
.fc-tabs button.on .fc-count{color:#2563eb}
.fc-tab-panel{padding-top:.6em}
.fc-tab-panel[hidden]{display:none}
.fc-sub-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:1em 0 .2em}
.fc-sub-tabs button{padding:4px 13px;border:1px solid #dbe3ef;border-radius:999px;background:#f8fafc;color:#5b6675;cursor:pointer;font:inherit;font-size:.85em}
.fc-sub-tabs button:hover{color:#2563eb;background:#fff}
.fc-sub-tabs button.on{background:#2563eb;border-color:#2563eb;color:#fff}
.fc-sub-tabs button.on .fc-count{color:#dbe7ff}
.fc-sub-panel[hidden]{display:none}
.fc-src-line{display:block;margin:12px 0 2px}

html[data-theme="dark"] .fc-meta div{background:#1d232b;border-color:#2e3640}
html[data-theme="dark"] .fc-meta span{color:#8f99a6}
html[data-theme="dark"] .fc-scene{border-top-color:#2b333c}
html[data-theme="dark"] .fc-scene h3{color:#dde5ec}
html[data-theme="dark"] .fc-src{color:#8f99a6}
html[data-theme="dark"] .fc-pass summary{color:#a5b4fc}
html[data-theme="dark"] .fc-pass blockquote{background:#232a33;border-left-color:#3b4654;color:#dde5ec}
html[data-theme="dark"] .fc-pass.opt blockquote{background:#1d2a22;border-left-color:#3f7a5a}
html[data-theme="dark"] .fc-note{background:#1d232b;border-color:#333c47;color:#a8b3bf}
html[data-theme="dark"] .fc-card{background:#1d232b;border-color:#2e3640}
html[data-theme="dark"] .fc-cue{color:#dde5ec}
html[data-theme="dark"] .fc-hold button,html[data-theme="dark"] .fc-all{background:#20262e;border-color:#333c47;color:#aeb8c2}
html[data-theme="dark"] .fc-hold button:hover,html[data-theme="dark"] .fc-all:hover{background:#28303a}
html[data-theme="dark"] .fc-ans{border-top-color:#333c47}
html[data-theme="dark"] .fc-chunk{color:#e6edf3}
html[data-theme="dark"] .fc-tag.produced{background:#16382a;color:#4ade80}
html[data-theme="dark"] .fc-tag.corrected{background:#3d2222;color:#f87171}
html[data-theme="dark"] .fc-tag.supplied{background:#252c48;color:#a5b4fc}
html[data-theme="dark"] .fc-orig{color:#8f99a6}
html[data-theme="dark"] .fc-orig s{color:#f87171}
html[data-theme="dark"] .fc-tabs{border-bottom-color:#2e3640}
html[data-theme="dark"] .fc-tabs button{background:#1d232b;border-color:#2e3640;color:#aeb8c2}
html[data-theme="dark"] .fc-tabs button:hover{color:#6ba3f5;background:#232a33}
html[data-theme="dark"] .fc-tabs button.on{background:#1c2229;color:#6ba3f5;border-bottom-color:#1c2229}
html[data-theme="dark"] .fc-tabs button.on .fc-count{color:#6ba3f5}
html[data-theme="dark"] .fc-sub-tabs button{background:#20262e;border-color:#333c47;color:#aeb8c2}
html[data-theme="dark"] .fc-sub-tabs button:hover{color:#6ba3f5;background:#28303a}
html[data-theme="dark"] .fc-sub-tabs button.on{background:#3b82f6;border-color:#3b82f6;color:#fff}
html[data-theme="dark"] .fc-sub-tabs button.on .fc-count{color:#cfe0ff}
</style>
`;

const SCRIPT = `
<script>
(function(){
  var root = document.getElementById('fc');
  if (!root) return;
  function setOne(card, open){
    var ans = card.querySelector('.fc-ans');
    var btn = card.querySelector('[data-fc="show"]');
    if (!ans || !btn) return;
    ans.hidden = !open;
    btn.textContent = open ? '\u6536\u8d77' : '\u770b\u7b54\u6848';
  }
  root.addEventListener('click', function(ev){
    var btn = ev.target.closest('[data-fc="show"]');
    if (!btn) return;
    var card = btn.closest('.fc-card');
    setOne(card, card.querySelector('.fc-ans').hidden);
  });
  var all = document.getElementById('fcAll');
  if (all){
    all.addEventListener('click', function(){
      // Only touch cards in the visible tab panel (offsetParent is null
      // inside a display:none panel).
      var cards = [].slice.call(root.querySelectorAll('.fc-card')).filter(function(c){
        return c.offsetParent !== null;
      });
      var anyHidden = cards.some(function(c){
        var a = c.querySelector('.fc-ans'); return a && a.hidden;
      });
      cards.forEach(function(c){ setOne(c, anyHidden); });
      all.textContent = anyHidden ? '\u5168\u90e8\u6536\u8d77' : '\u5168\u90e8\u5c55\u5f00';
    });
  }

  // ---- scene sub-tabs (one per section inside a scene file) ----
  function showSub(file, idx){
    var bar = document.getElementById('fc-subtabs-' + file);
    if (!bar) return;
    var bs = bar.querySelectorAll('button[data-sub]');
    if (!bs.length) return;
    if (idx < 0 || idx >= bs.length) idx = 0;
    for (var i = 0; i < bs.length; i++){
      var on = (i === idx);
      bs[i].classList.toggle('on', on);
      bs[i].setAttribute('aria-selected', on ? 'true' : 'false');
      var p = document.getElementById('fc-sub-' + file + '-' + i);
      if (p) p.hidden = !on;
    }
  }
  root.addEventListener('click', function(ev){
    var b = ev.target.closest('button[data-sub]');
    if (!b) return;
    var file = b.getAttribute('data-file');
    var idx = +b.getAttribute('data-sub');
    showSub(file, idx);
    if (window.history.replaceState){
      window.history.replaceState(null, '', '#' + file + '-' + idx);
    }
  });

  // ---- scene tabs ----
  // One tab per scene file; all panels render once at load so switching is
  // instant. The hash doubles as a deep link, e.g. /form/chunks.html#kitchen.
  var tabs = document.getElementById('fcTabs');
  if (tabs){
    var tbs = tabs.querySelectorAll('button[data-tab]');
    var names = [];
    for (var i = 0; i < tbs.length; i++) names.push(tbs[i].getAttribute('data-tab'));
    var showTab = function(name){
      // Hash may target a sub-tab: #kitchen-2 = kitchen tab, 3rd section.
      var sub = -1;
      var m = /^(.*)-([0-9]+)$/.exec(name);
      if (m && names.indexOf(m[1]) !== -1){ name = m[1]; sub = +m[2]; }
      if (names.indexOf(name) === -1) name = names[0];
      names.forEach(function(n){
        var p = document.getElementById('fc-panel-' + n);
        if (p) p.hidden = (n !== name);
      });
      for (var j = 0; j < tbs.length; j++){
        var on = tbs[j].getAttribute('data-tab') === name;
        tbs[j].classList.toggle('on', on);
        tbs[j].setAttribute('aria-selected', on ? 'true' : 'false');
      }
      if (sub >= 0) showSub(name, sub);
      var want = '#' + (sub >= 0 ? name + '-' + sub : name);
      if (want !== window.location.hash && window.history.replaceState){
        window.history.replaceState(null, '', want);
      }
    };
    tabs.addEventListener('click', function(ev){
      var b = ev.target.closest('button[data-tab]');
      if (b) showTab(b.getAttribute('data-tab'));
    });
    showTab((window.location.hash || '').replace('#', ''));
  }
})();
</script>
`;

function shortTitle(t) {
  const short = String(t).replace(/^\u573a\u666f\u8bcd\u5757\uff1a/, '').trim();
  return short || t;
}

const TAG_LABEL = { produced: '\u4ea7\u51fa\u6b63\u786e', corrected: '\u7ea0\u9519', supplied: '\u8bcd\u5e93\u8865\u5145' };

function renderCard(c) {
  const out = ['<div class="fc-card">'];
  out.push('<div class="fc-cue">' + esc(c.cue) + '</div>');
  out.push('<div class="fc-hold"><button type="button" data-fc="show">\u770b\u7b54\u6848</button></div>');
  const tag = c.kind ? '<span class="fc-tag ' + c.kind + '">' + TAG_LABEL[c.kind] + '</span>' : '';
  out.push('<div class="fc-ans" hidden><div class="fc-chunk">' + esc(c.chunk) + tag + '</div>');
  if (c.original) out.push('<div class="fc-orig">\u539f\u6765\u5199\u7684\u662f\uff1a<s>' + esc(c.original) + '</s></div>');
  out.push('</div></div>');
  return out.join('\n');
}

function renderSection(s) {
  const out = [];
  if (s.src) out.push('<span class="fc-src fc-src-line">' + esc(s.src) + '</span>');
  if (s.optimized) {
    out.push('<details class="fc-pass opt" open><summary>\u4f18\u5316\u7248\uff08\u80cc\u8bf5\u6587\u672c\uff09</summary><blockquote>' + esc(s.optimized) + '</blockquote></details>');
  }
  if (s.original) {
    out.push('<details class="fc-pass"><summary>\u539f\u53e5\uff08\u5bf9\u7167\uff09</summary><blockquote>' + esc(s.original) + '</blockquote></details>');
  }
  for (const c of s.chunks) out.push(renderCard(c));
  for (const n of s.notes) out.push('<div class="fc-note">' + esc(n) + '</div>');
  return out.join('\n');
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
  if (!fs.existsSync(CHUNKS)) {
    console.log('No form/chunks directory; nothing to import.');
    return;
  }
  const files = fs.readdirSync(CHUNKS).filter((f) => f.endsWith('.md') && f !== 'index.md').sort();
  const scenes = files.map((f) =>
    Object.assign(parseSceneFile(path.join(CHUNKS, f)), { slug: f.replace(/\.md$/, '') }));

  let totalChunks = 0, totalSections = 0;
  for (const sc of scenes) for (const s of sc.sections) { totalSections++; totalChunks += s.chunks.length; }

  const meta = '<div class="fc-meta">' +
    '<div><b>' + scenes.length + '</b><span>scene files</span></div>' +
    '<div><b>' + totalSections + '</b><span>scenes</span></div>' +
    '<div><b>' + totalChunks + '</b><span>chunks</span></div></div>';

  const body = [
    STYLE,
    '\u52a8\u4f5c\u94fe drill \u7684\u573a\u666f\u4e13\u7528\u56fa\u5b9a\u642d\u914d\u5e93\u3002\u6bcf\u4e2a\u573a\u666f\u5305\u542b\uff1a\u4f18\u5316\u7248\u5168\u6587\uff08\u80cc\u8bf5\u6587\u672c\uff0c\u9ed8\u8ba4\u5c55\u5f00\uff09\u3001\u539f\u53e5\uff08\u5bf9\u7167\uff0c\u9ed8\u8ba4\u6536\u8d77\uff09\u3001\u9010\u6761\u8bcd\u5757\u5361\u7247\u3002',
    '',
    '\u5361\u7247\u7528\u6cd5\uff1a\u770b\u4e2d\u6587\u60f3\u82f1\u6587\uff0c\u60f3\u8d77\u6765\u518d\u70b9\u300c\u770b\u7b54\u6848\u300d\u6838\u5bf9\u3002\u6807\u7b7e\u542b\u4e49\uff1a**\u4ea7\u51fa\u6b63\u786e** = \u5f53\u65f6\u81ea\u5df1\u5199\u5bf9\u7684\uff1b**\u7ea0\u9519** = \u5199\u9519\u8fc7\u3001\u9644\u539f\u6765\u7684\u5199\u6cd5\u5bf9\u7167\uff1b**\u8bcd\u5e93\u8865\u5145** = \u5e94\u8be5\u4f1a\u4f46\u5f53\u65f6\u6ca1\u7528\u4e0a\u7684\u3002',
    '',
    meta,
    '<button type="button" id="fcAll" class="fc-all">\u5168\u90e8\u5c55\u5f00</button>',
    '<div id="fc">',
    '<div class="fc-tabs" id="fcTabs" role="tablist" aria-label="\u573a\u666f">' +
      scenes.map((sc, i) =>
        '<button type="button" role="tab" data-tab="' + esc(sc.slug) + '"' +
        (i === 0 ? ' class="on" aria-selected="true"' : ' aria-selected="false"') + '>' +
        esc(shortTitle(sc.title)) + '<span class="fc-count">' + sc.sections.length + '</span></button>'
      ).join('') + '</div>',
    scenes.map((sc, i) => {
      const seen = {};
      const subBar = '<div class="fc-sub-tabs" id="fc-subtabs-' + esc(sc.slug) +
        '" role="tablist" aria-label="' + esc(sc.title) + '">' +
        sc.sections.map((sec, j) => {
          // Duplicate section names within one file get a running number.
          seen[sec.name] = (seen[sec.name] || 0) + 1;
          const label = seen[sec.name] > 1 ? sec.name + ' ' + seen[sec.name] : sec.name;
          return '<button type="button" role="tab" data-file="' + esc(sc.slug) +
            '" data-sub="' + j + '"' +
            (j === 0 ? ' class="on" aria-selected="true"' : ' aria-selected="false"') + '>' +
            esc(label) + '<span class="fc-count">' + sec.chunks.length + '</span></button>';
        }).join('') + '</div>';
      const subPanels = sc.sections.map((sec, j) =>
        '<div class="fc-sub-panel" id="fc-sub-' + esc(sc.slug) + '-' + j + '" role="tabpanel"' +
        (j === 0 ? '' : ' hidden') + '>\n' + renderSection(sec) + '\n</div>'
      ).join('\n');
      return '<div class="fc-tab-panel" id="fc-panel-' + esc(sc.slug) + '" role="tabpanel"' +
        (i === 0 ? '' : ' hidden') + '>\n' + subBar + '\n' + subPanels + '\n</div>';
    }).join('\n'),
    '</div>',
    SCRIPT,
  ].join('\n');

  assertScriptParses('form-chunks', body);
  writeFile(path.join(SOURCE, 'form', 'chunks.md'),
    frontmatter({ title: 'Form Scene Chunks', layout: 'page' }) + '\n\n' + body + '\n');

  console.log('Imported ' + scenes.length + ' scene file(s) with ' + totalChunks + ' chunk card(s).');
}

main();
