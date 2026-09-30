#!/usr/bin/env node
/**
 * Import chat/qa.md (language questions asked mid-practice, with answers) into
 * the Hexo source tree as one self-contained review page:
 *
 *   source/qa/index.md
 *
 * The question is the prompt and the answer is the check, so answers stay
 * hidden behind a button. Generated output is gitignored and recreated on
 * every build; chat/qa.md is the source of truth. The qa.md format and this
 * importer change in the same commit.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'source');
const QA_MD = path.join(ROOT, 'chat', 'qa.md');
const OUT_DIR = path.join(SOURCE, 'qa');
const DATA_DIR = path.join(SOURCE, '_data');

const GENERATED = [OUT_DIR];

function readText(p) { return fs.readFileSync(p, 'utf8'); }

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}

function ensureClean() {
  const sourceRoot = path.resolve(SOURCE);
  for (const p of GENERATED) {
    const resolved = path.resolve(p);
    if (resolved !== sourceRoot && !resolved.startsWith(sourceRoot + path.sep)) {
      throw new Error('Refusing to clean path outside source/: ' + resolved);
    }
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}

function siteRoot() {
  const m = /^root:\s*(\S+)/m.exec(readText(path.join(ROOT, '_config.yml')));
  return m ? m[1] : '/';
}

function frontmatter(fields) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) lines.push(k + ': ' + v);
  lines.push('---');
  return lines.join('\n');
}

const DAY_RE = /^##\s+(Day\s+\d+)\s+-\s+(\d{4}-\d{2}-\d{2})\s*$/;

/**
 * qa.md -> [{ day, date, entries: [{ q, a }] }] in file order.
 * Sections start at `## Day NN - YYYY-MM-DD`; entries are `**Q:**` / `**A:**`
 * blocks separated by `---`.
 */
function parseQa(md) {
  const days = [];
  let cur = null, entry = null, field = null;
  const flush = () => {
    if (!cur || !entry) return;
    entry.q = entry.q.join(' ').replace(/\s+/g, ' ').trim();
    entry.a = entry.a.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (entry.q && entry.a) cur.entries.push(entry);
    entry = null; field = null;
  };
  for (const line of md.split(/\r?\n/)) {
    const h = DAY_RE.exec(line);
    if (h) { flush(); cur = { day: h[1], date: h[2], entries: [] }; days.push(cur); continue; }
    if (!cur) continue;
    if (/^---\s*$/.test(line)) { flush(); continue; }
    const q = /^\*\*Q:\*\*\s?(.*)$/.exec(line);
    if (q) { flush(); entry = { q: [q[1]], a: [] }; field = 'q'; continue; }
    const a = /^\*\*A:\*\*\s?(.*)$/.exec(line);
    if (a && entry) { entry.a.push(a[1]); field = 'a'; continue; }
    if (!entry) continue;
    if (field === 'q') entry.q.push(line);
    else if (field === 'a') entry.a.push(line);
  }
  flush();
  return days.filter((d) => d.entries.length);
}

/* ---- tiny markdown: bold, inline code, "- " bullets, hard-wrapped prose ---- */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function renderAnswer(a) {
  return a.split(/\n\s*\n/).map((para) => {
    let html = '';
    const prose = [];
    const items = [];
    const flushProse = () => {
      if (prose.length) { html += '<p>' + inline(prose.join(' ')) + '</p>'; prose.length = 0; }
    };
    const flushItems = () => {
      if (items.length) {
        html += '<ul>' + items.map((i) => '<li>' + inline(i) + '</li>').join('') + '</ul>';
        items.length = 0;
      }
    };
    for (const raw of para.split('\n')) {
      if (!raw.trim()) continue;
      const bullet = /^\s*-\s+(.*)$/.exec(raw);
      if (bullet) { flushProse(); items.push(bullet[1].trim()); continue; }
      if (items.length && /^\s+\S/.test(raw)) {
        items[items.length - 1] += ' ' + raw.trim();
        continue;
      }
      flushItems();
      prose.push(raw.trim());
    }
    flushProse(); flushItems();
    return html;
  }).join('');
}

const QA_STYLE = `<style>
.qa-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:1.2em 0}
.qa-toolbar input{flex:1 1 220px;padding:7px 12px;border:1px solid #dbe3ef;border-radius:8px;font:inherit;font-size:.92em;background:#fff;color:inherit}
.qa-toolbar button{padding:6px 14px;border:1px solid #dbe3ef;border-radius:999px;background:#fff;color:#2563eb;cursor:pointer;font:inherit;font-size:.85em}
.qa-toolbar button:hover{background:#eef4ff}
.qa-day{margin:1.6em 0}
.qa-day h3{margin:.4em 0 .2em;color:#334155}
.qa-day h3 small{font-weight:400;color:#9aa4b0;font-size:.72em;margin-left:8px}
.qa-item{border:1px solid #e3e8ef;border-radius:12px;padding:13px 16px;margin:10px 0;background:#fff}
.qa-q{line-height:1.65;font-weight:600;color:#1e293b;overflow-wrap:anywhere;word-break:break-word}
.qa-btn{margin-top:9px;padding:4px 13px;border:1px solid #c7d7f5;border-radius:8px;background:#fff;color:#2563eb;cursor:pointer;font:inherit;font-size:.85em}
.qa-btn:hover{background:#eef4ff}
.qa-a{margin-top:10px;padding-top:10px;border-top:1px dashed #dbe3ef;line-height:1.7;color:#374151;overflow-wrap:anywhere;word-break:break-word}
.qa-a p{margin:.45em 0}
.qa-a ul{margin:.4em 0;padding-left:1.4em}
.qa-a li{margin:.25em 0}
.qa-a code{background:#f1f5f9;border-radius:4px;padding:1px 5px;font-size:.92em}
html[data-theme="dark"] .qa-day h3{color:#c2ccd6}
html[data-theme="dark"] .qa-item{background:#1d232b;border-color:#2e3640}
html[data-theme="dark"] .qa-q{color:#dde5ec}
html[data-theme="dark"] .qa-a{color:#b8c2cc;border-top-color:#2e3640}
html[data-theme="dark"] .qa-a code{background:#2a323b;color:#aeb8c2}
html[data-theme="dark"] .qa-toolbar input{background:#1d232b;border-color:#333c47;color:#dde5ec}
html[data-theme="dark"] .qa-toolbar button,
html[data-theme="dark"] .qa-btn{background:#20262e;border-color:#333c47;color:#aeb8c2}
html[data-theme="dark"] .qa-toolbar button:hover,
html[data-theme="dark"] .qa-btn:hover{background:#28303a}
</style>`;

const QA_SCRIPT = `<script>(function(){
  var list = document.getElementById('qaList');
  if (!list || typeof QA_DATA === 'undefined') return;
  list.innerHTML = QA_DATA.days.map(function(d){
    var items = d.entries.map(function(e){
      return '<div class="qa-item">' +
        '<div class="qa-q">' + e.q + '</div>' +
        '<button type="button" class="qa-btn">看答案</button>' +
        '<div class="qa-a" hidden>' + e.a + '</div></div>';
    }).join('');
    return '<section class="qa-day"><h3>' + d.day +
      '<small>' + d.date + ' &middot; ' + d.entries.length + ' 问</small></h3>' +
      items + '</section>';
  }).join('');

  function setOpen(item, open){
    var a = item.querySelector('.qa-a');
    var b = item.querySelector('.qa-btn');
    if (!a || !b) return;
    a.hidden = !open;
    b.textContent = open ? '收起' : '看答案';
  }

  list.addEventListener('click', function(ev){
    var b = ev.target.closest('.qa-btn');
    if (!b) return;
    var item = b.closest('.qa-item');
    setOpen(item, item.querySelector('.qa-a').hidden);
  });

  var expand = document.getElementById('qaExpand');
  var collapse = document.getElementById('qaCollapse');
  if (expand) expand.addEventListener('click', function(){
    list.querySelectorAll('.qa-item').forEach(function(i){ setOpen(i, true); });
  });
  if (collapse) collapse.addEventListener('click', function(){
    list.querySelectorAll('.qa-item').forEach(function(i){ setOpen(i, false); });
  });

  var input = document.getElementById('qaFilter');
  if (input) input.addEventListener('input', function(){
    var needle = input.value.trim().toLowerCase();
    list.querySelectorAll('.qa-item').forEach(function(item){
      var hay = item.textContent.toLowerCase();
      item.style.display = (!needle || hay.indexOf(needle) !== -1) ? '' : 'none';
    });
    list.querySelectorAll('.qa-day').forEach(function(day){
      var any = [].some.call(day.querySelectorAll('.qa-item'), function(i){
        return i.style.display !== 'none';
      });
      day.style.display = any ? '' : 'none';
    });
  });
})();</script>`;

function main() {
  if (!fs.existsSync(QA_MD)) {
    console.log('import-qa: chat/qa.md not found, skipping.');
    return;
  }
  ensureClean();

  const days = parseQa(readText(QA_MD));
  const total = days.reduce((n, d) => n + d.entries.length, 0);

  // Newest day first for review; entries keep file order inside a day.
  days.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const data = {
    days: days.map((d) => ({
      day: d.day,
      date: d.date,
      entries: d.entries.map((e) => ({ q: inline(e.q), a: renderAnswer(e.a) })),
    })),
  };

  const page = [
    frontmatter({ title: 'Language Q&A', layout: 'page' }),
    '',
    'Language questions asked mid-practice, with answers. The question is the',
    'prompt - try to answer it yourself first, then reveal. Newest day first.',
    'Generated from `chat/qa.md` by `tools/import-qa.js`.',
    '',
    QA_STYLE,
    '<p><strong>' + total + '</strong> 问 &middot; <strong>' + days.length + '</strong> 天</p>',
    '<div class="qa-toolbar">' +
      '<input id="qaFilter" type="search" placeholder="筛选问题或答案…" aria-label="筛选">' +
      '<button type="button" id="qaExpand">全部展开</button>' +
      '<button type="button" id="qaCollapse">全部收起</button></div>',
    '<div id="qaList"></div>',
    '<script>var QA_DATA = ' +
      JSON.stringify(data).replace(/</g, '\\u003c') + ';</script>',
    QA_SCRIPT,
    '',
  ].join('\n');

  writeFile(path.join(OUT_DIR, 'index.md'), page);

  // Learning hub reads this; days are already newest-first.
  writeFile(path.join(DATA_DIR, 'qa.json'), JSON.stringify({
    generated: new Date().toISOString(),
    total,
    days: days.map((d) => ({ day: d.day, date: d.date, entries: d.entries.length })),
  }, null, 2) + '\n');
  console.log('import-qa: ' + total + ' entries across ' + days.length +
    ' days -> source/qa/index.md');
}

main();
