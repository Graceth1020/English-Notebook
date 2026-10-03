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
      var cards = [].slice.call(root.querySelectorAll('.fc-card'));
      var anyHidden = cards.some(function(c){
        var a = c.querySelector('.fc-ans'); return a && a.hidden;
      });
      cards.forEach(function(c){ setOne(c, anyHidden); });
      all.textContent = anyHidden ? '\u5168\u90e8\u6536\u8d77' : '\u5168\u90e8\u5c55\u5f00';
    });
  }
})();
</script>
`;

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
  const out = ['<div class="fc-scene"><h3>' + esc(s.name) +
    (s.src ? ' <span class="fc-src">' + esc(s.src) + '</span>' : '') + '</h3></div>'];
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
  const scenes = files.map((f) => parseSceneFile(path.join(CHUNKS, f)));

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
    scenes.map((sc) => '<h2>' + esc(sc.title) + '</h2>\n' + sc.sections.map(renderSection).join('\n')).join('\n'),
    '</div>',
    SCRIPT,
  ].join('\n');

  assertScriptParses('form-chunks', body);
  writeFile(path.join(SOURCE, 'form', 'chunks.md'),
    frontmatter({ title: 'Form Scene Chunks', layout: 'page' }) + '\n\n' + body + '\n');

  console.log('Imported ' + scenes.length + ' scene file(s) with ' + totalChunks + ' chunk card(s).');
}

main();
