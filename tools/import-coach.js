#!/usr/bin/env node
/**
 * Import English Level-Up Coach content into the Hexo source tree.
 *
 * Reads coach/ at the site root and generates:
 *   source/_data/coach.json                 - data for the dashboard page
 *   source/_posts/Coach/Lessons/...         - lesson posts
 *   source/_posts/Coach/Reviews/...         - weekly review posts
 *   source/coach/index.md                   - dashboard page (self-contained HTML/JS)
 *
 * Generated output is gitignored and recreated on every build, mirroring
 * tools/import-rephrase.js. coach/ is the source of truth.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'source');
const POSTS = path.join(SOURCE, '_posts');
const DATA_DIR = path.join(SOURCE, '_data');
const COACH = path.join(ROOT, 'coach');

const GENERATED = [
  path.join(POSTS, 'Coach'),
  path.join(SOURCE, 'coach'),
  path.join(DATA_DIR, 'coach.json'),
];

const LESSON_RE = /^lesson-(\d+)-(\d{8})(?:-(\d+))?\.md$/;
const REVIEW_RE = /^week-(\d+)-review\.md$/;

function posix(p) { return p.split(path.sep).join('/'); }

function readDir(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return []; }
}

function walkFiles(dir) {
  const out = [];
  const stack = [''];
  while (stack.length) {
    const rel = stack.pop();
    let entries;
    try { entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true }); }
    catch (_) { continue; }
    for (const e of entries) {
      const next = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) stack.push(next);
      else if (e.isFile()) out.push(next);
    }
  }
  return out.sort();
}

function readText(p) { return fs.readFileSync(p, 'utf8'); }

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
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
    if (Array.isArray(v)) {
      lines.push(k + ':');
      for (const item of v) lines.push('  - ' + item);
    } else lines.push(k + ': ' + yamlScalar(v));
  }
  lines.push('---');
  return lines.join('\n');
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

/** Split simple `key: value` frontmatter off a markdown file. */
function splitFrontmatter(text) {
  const meta = {};
  if (!text.startsWith('---')) return { meta, body: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { meta, body: text };
  const head = text.slice(3, end);
  for (const line of head.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (m) meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  let body = text.slice(end + 4);
  if (body.startsWith('\n')) body = body.slice(1);
  return { meta, body };
}

function parseLessons() {
  const dir = path.join(COACH, 'lessons');
  const out = [];
  for (const rel of walkFiles(dir)) {
    const base = path.basename(rel);
    const m = LESSON_RE.exec(base);
    if (!m) continue;
    const { meta, body } = splitFrontmatter(readText(path.join(dir, rel)));
    const stem = base.replace(/\.md$/, '');
    const weekDir = /week-(\d+)/i.exec(posix(path.dirname(rel)));
    let title = 'Lesson ' + m[1];
    const lines = [];
    let first = true;
    for (const line of body.split(/\r?\n/)) {
      if (first && line.startsWith('# ')) { title = line.slice(2).trim(); first = false; continue; }
      lines.push(line);
    }
    const turns = (body.match(/^###\s+Turn\s+\d+/gim) || []).length;
    out.push({
      kind: 'lesson',
      turns,
      stem,
      num: +m[1],
      date: meta.date || fmtDate(m[2]),
      week: +(meta.week || (weekDir ? weekDir[1] : 1)),
      goal: meta.goal || '',
      material: meta.material || '',
      stage: meta.stage || 'awaiting-answers',
      title,
      body: lines.join('\n').trim(),
    });
  }
  return out.sort((a, b) => a.num - b.num);
}

function parseReviews() {
  const dir = path.join(COACH, 'reviews');
  const out = [];
  for (const rel of walkFiles(dir)) {
    const base = path.basename(rel);
    const m = REVIEW_RE.exec(base);
    if (!m) continue;
    const { meta, body } = splitFrontmatter(readText(path.join(dir, rel)));
    const lines = [];
    let title = 'Week ' + m[1] + ' Review';
    let first = true;
    for (const line of body.split(/\r?\n/)) {
      if (first && line.startsWith('# ')) { title = line.slice(2).trim(); first = false; continue; }
      lines.push(line);
    }
    out.push({
      kind: 'review',
      stem: base.replace(/\.md$/, ''),
      week: +m[1],
      date: meta.date || '',
      title,
      body: lines.join('\n').trim(),
    });
  }
  return out.sort((a, b) => a.week - b.week);
}

/** Parse the markdown table in coach/errors.md. */
function parseErrors() {
  const p = path.join(COACH, 'errors.md');
  if (!fs.existsSync(p)) return [];
  const out = [];
  for (const line of readText(p).split(/\r?\n/)) {
    if (!/^\|\s*E\d+\s*\|/.test(line)) continue;
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '')
      .split('|').map((c) => c.trim().replace(/\\\|/g, '|'));
    if (cells.length < 9) continue;
    out.push({
      id: cells[0], pattern: cells[1], category: cells[2], said: cells[3],
      fix: cells[4], lesson: cells[5], hits: +cells[6] || 1,
      status: cells[7], next: cells[8],
    });
  }
  return out;
}

/** Pull the phase table and ledger out of coach/plan.md. */
function parsePlan() {
  const p = path.join(COACH, 'plan.md');
  if (!fs.existsSync(p)) return { phases: [], ledger: [] };
  const phases = [];
  const ledger = [];
  for (const line of readText(p).split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '')
      .split('|').map((c) => c.trim());
    if (cells.length === 4 && /^\d+$/.test(cells[0])) {
      phases.push({ phase: +cells[0], weeks: cells[1], theme: cells[2], status: cells[3] });
    } else if (cells.length === 7 && /^\d+$/.test(cells[0])) {
      ledger.push({
        num: +cells[0], week: cells[1], date: cells[2], goal: cells[3],
        material: cells[4], fixes: cells[5], status: cells[6],
      });
    }
  }
  return { phases, ledger };
}

const CLOCK_RE = /(\d+):(\d{2})(?::(\d{2}))?/;

function toSeconds(t) {
  const m = CLOCK_RE.exec(String(t || ''));
  if (!m) return 0;
  return m[3]
    ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3])
    : (+m[1]) * 60 + (+m[2]);
}

function fmtClock(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const pad = (n) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? h + ':' + pad(m) + ':' + pad(s % 60) : m + ':' + pad(s % 60);
}

const TRANSCRIPT_LINE_RE = /^(\d+)\.\s*(>>\s*)?\[([\d:]+)\]\s*(.*?)\s*(?:<(\S+)>)?$/;

/**
 * Read a material's transcript. transcript.json is preferred (exact start
 * times, turn flags); transcript.md is the fallback so hand-written material
 * without the JSON sidecar still publishes.
 */
function parseTranscript(matDir) {
  const jsonPath = path.join(matDir, 'transcript.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = JSON.parse(readText(jsonPath));
      const sentences = (raw.sentences || []).map((s, i) => {
        const sec = s.start != null ? Math.floor(s.start / 1000) : toSeconds(s.time);
        return {
          n: s.n || i + 1,
          time: s.time || fmtClock(sec),
          sec,
          turn: !!s.turn_start,
          text: String(s.text || '').trim(),
        };
      }).filter((s) => s.text);
      if (sentences.length) {
        return {
          sentences,
          title: raw.title || '',
          url: raw.url || '',
          duration: raw.duration_ms ? fmtClock(raw.duration_ms / 1000) : '',
          source: 'transcript.json',
        };
      }
    } catch (e) {
      console.warn('Skipping unreadable ' + jsonPath + ': ' + e.message);
    }
  }

  const mdPath = path.join(matDir, 'transcript.md');
  if (!fs.existsSync(mdPath)) return null;
  const text = readText(mdPath);
  const sentences = [];
  for (const line of text.split(/\r?\n/)) {
    const m = TRANSCRIPT_LINE_RE.exec(line.trim());
    if (!m) continue;
    const body = m[4].trim();
    if (!body) continue;
    let sec = toSeconds(m[3]);
    const tm = m[5] ? /[?&]t=(\d+)/.exec(m[5]) : null;
    if (tm) sec = +tm[1];
    sentences.push({ n: +m[1], time: m[3], sec, turn: !!m[2], text: body });
  }
  if (!sentences.length) return null;
  const t = /^#\s+(.+)$/m.exec(text);
  const u = /^Source:\s*(\S+)/m.exec(text);
  const d = /Duration:\s*([\d:]+)/.exec(text);
  return {
    sentences,
    title: t ? t[1].trim() : '',
    url: u ? u[1].trim() : '',
    duration: d ? d[1] : '',
    source: 'transcript.md',
  };
}

/** Strip inline markdown emphasis so table cells render as plain text. */
function plain(v) {
  return String(v == null ? '' : v)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function parseMaterials(root) {
  const dir = path.join(COACH, 'materials');
  const out = [];
  for (const entry of readDir(dir)) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const matDir = path.join(dir, slug);
    const seriesPath = path.join(matDir, 'series.md');
    const tPath = path.join(matDir, 'transcript.md');
    const item = {
      slug, title: slug, url: '', duration: '', segments: [],
      sentences: 0, transcript: '', lines: [],
    };
    if (fs.existsSync(tPath)) {
      const text = readText(tPath);
      const t = /^#\s+(.+)$/m.exec(text);
      if (t) item.title = t[1].trim();
      const u = /^Source:\s*(\S+)/m.exec(text);
      if (u) item.url = u[1].trim();
      const d = /Duration:\s*([\d:]+)/.exec(text);
      if (d) item.duration = d[1];
    }
    const tr = parseTranscript(matDir);
    if (tr) {
      if (tr.title && item.title === slug) item.title = tr.title;
      if (!item.url) item.url = tr.url;
      if (!item.duration) item.duration = tr.duration;
      item.lines = tr.sentences;
      item.sentences = tr.sentences.length;
      item.transcript = root + 'coach/materials/' + slug + '/';
    }
    if (fs.existsSync(seriesPath)) {
      for (const line of readText(seriesPath).split(/\r?\n/)) {
        if (!line.trim().startsWith('|')) continue;
        const c = line.trim().replace(/^\|/, '').replace(/\|$/, '')
          .split('|').map((x) => x.trim());
        if (c.length >= 6 && /^\d+$/.test(c[0])) {
          const range = /(\d+)\s*-\s*(\d+)/.exec(c[2]);
          item.segments.push({
            seg: +c[0], time: c[1], sentences: c[2],
            from: range ? +range[1] : null, to: range ? +range[2] : null,
            topic: plain(c[3]), focus: plain(c[4]), lesson: c[5],
          });
        }
      }
    }
    out.push(item);
  }
  return out;
}

function siteRoot() {
  try {
    const cfg = readText(path.join(ROOT, '_config.yml'));
    const m = /^root:\s*(\S+)/m.exec(cfg);
    if (m) return m[1].replace(/^["']|["']$/g, '');
  } catch (_) { /* ignore */ }
  return '/';
}

const DASH_STYLE = `
<style>
.coach-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin:1.4em 0}
.coach-stat{border:1px solid #e3e8ef;border-radius:10px;padding:14px 16px;background:#fff}
.coach-stat b{display:block;font-size:1.9em;line-height:1.1;color:#3b82f6}
.coach-stat span{font-size:.82em;color:#888;text-transform:uppercase;letter-spacing:.04em}
.coach-bar{height:9px;border-radius:5px;background:#eef1f5;overflow:hidden;margin:6px 0 2px}
.coach-bar i{display:block;height:100%;background:#3b82f6}
.coach-phase{border:1px solid #e3e8ef;border-radius:10px;padding:12px 16px;margin-bottom:10px;background:#fff}
.coach-phase.done{border-color:#bbf7d0}.coach-phase.active{border-color:#93c5fd}
.coach-tag{display:inline-block;font-size:.72em;font-weight:700;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#4338ca;margin-left:6px}
.coach-err{border:1px solid #e3e8ef;border-radius:10px;padding:12px 16px;margin-bottom:10px;background:#fff}
.coach-err.due{border-left:4px solid #f59e0b}
.coach-err.resolved{opacity:.55}
.coach-err .said{color:#b91c1c;font-family:ui-monospace,monospace;font-size:.9em}
.coach-err .fix{color:#047857;font-family:ui-monospace,monospace;font-size:.9em}
.coach-filters{display:flex;flex-wrap:wrap;gap:8px;margin:1em 0}
.coach-filters button{padding:5px 12px;border:1px solid #dbe3ef;border-radius:999px;background:#fff;cursor:pointer;font:inherit;font-size:.85em}
.coach-filters button.on{background:#3b82f6;border-color:#3b82f6;color:#fff}
.coach-lesson{display:flex;gap:12px;align-items:baseline;padding:9px 0;border-bottom:1px solid #eef1f5}
.coach-lesson b{min-width:2.4em;color:#3b82f6}
.coach-lesson small{color:#999;margin-left:auto;white-space:nowrap}
html[data-theme="dark"] .coach-stat,html[data-theme="dark"] .coach-phase,
html[data-theme="dark"] .coach-err{background:#1d232b;border-color:#2e3640}
html[data-theme="dark"] .coach-bar{background:#262e37}
html[data-theme="dark"] .coach-filters button{background:#20262e;border-color:#333c47;color:#aeb8c2}
html[data-theme="dark"] .coach-err .said{color:#fca5a5}
html[data-theme="dark"] .coach-err .fix{color:#6ee7b7}
</style>`;

const DASH_SCRIPT = `
<script>
(function(){
  var D = window.COACH_DATA || {};
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var el = function(id){ return document.getElementById(id); };

  var errs = D.errors || [], lessons = D.lessons || [], plan = D.plan || {};
  var today = new Date().toISOString().slice(0,10);
  var open = errs.filter(function(e){ return e.status !== 'resolved'; });
  var due = open.filter(function(e){ return e.next && e.next !== '-' && e.next <= today; });
  var weeksDone = plan.phases ? plan.phases.filter(function(p){ return p.status==='complete'; }).length : 0;

  var totalTurns = lessons.reduce(function(n,l){ return n + (l.turns||0); }, 0);
  var s = el('coachStats');
  if (s) s.innerHTML =
    '<div class="coach-stat"><b>'+lessons.length+'</b><span>Lessons</span></div>'+
    '<div class="coach-stat"><b>'+totalTurns+'</b><span>Dialogue turns</span></div>'+
    '<div class="coach-stat"><b>'+open.length+'</b><span>Open errors</span></div>'+
    '<div class="coach-stat"><b>'+due.length+'</b><span>Due for review</span></div>'+
    '<div class="coach-stat"><b>'+errs.filter(function(e){return e.status==='resolved';}).length+
      '</b><span>Resolved</span></div>';

  var ph = el('coachPhases');
  if (ph && plan.phases) ph.innerHTML = plan.phases.map(function(p){
    var cls = p.status==='complete'?'done':(/progress/i.test(p.status)?'active':'');
    return '<div class="coach-phase '+cls+'"><b>Phase '+p.phase+'</b> '+
      '<small>weeks '+esc(p.weeks)+'</small><span class="coach-tag">'+esc(p.status)+'</span>'+
      '<div>'+esc(p.theme)+'</div></div>';
  }).join('');

  var prog = el('coachProgress');
  if (prog) {
    var pct = Math.min(100, Math.round(lessons.length/72*100));
    prog.innerHTML = '<div class="coach-bar"><i style="width:'+pct+'%"></i></div>'+
      '<small>'+lessons.length+' of 72 sessions ('+pct+'%) &middot; 12-week plan</small>';
  }

  var ll = el('coachLessons');
  if (ll) ll.innerHTML = lessons.length ? lessons.slice().reverse().map(function(l){
    return '<div class="coach-lesson"><b>'+String(l.num).padStart(2,'0')+'</b>'+
      '<a href="'+esc(l.url)+'">'+esc(l.goal||l.title)+'</a>'+
      '<small>'+esc(l.date)+' &middot; '+(l.turns?l.turns+' turns &middot; ':'')+
      esc(l.stage)+
      (l.transcript?' &middot; <a href="'+esc(l.transcript)+'">material</a>':'')+
      '</small></div>';
  }).join('') : '<p>No lessons yet.</p>';

  var filter = 'due';
  function renderErrs(){
    var list = filter==='all'?errs:(filter==='due'?due:open.filter(function(e){
      return e.category===filter; }));
    var box = el('coachErrors');
    if (!box) return;
    if (!list.length){ box.innerHTML = '<p>Nothing here.</p>'; return; }
    box.innerHTML = list.map(function(e){
      var isDue = e.next && e.next!=='-' && e.next<=today && e.status!=='resolved';
      return '<div class="coach-err '+(e.status==='resolved'?'resolved':(isDue?'due':''))+'">'+
        '<b>'+esc(e.id)+'</b> '+esc(e.pattern)+
        '<span class="coach-tag">'+esc(e.category)+'</span>'+
        '<span class="coach-tag">hits '+e.hits+'</span>'+
        (isDue?'<span class="coach-tag">due</span>':'')+
        '<div class="said">&times; '+esc(e.said)+'</div>'+
        '<div class="fix">&check; '+esc(e.fix)+'</div></div>';
    }).join('');
  }
  var cats = {};
  open.forEach(function(e){ cats[e.category]=(cats[e.category]||0)+1; });
  var fb = el('coachFilters');
  if (fb){
    var btns = [['due','Due ('+due.length+')'],['all','All ('+errs.length+')']]
      .concat(Object.keys(cats).sort().map(function(c){ return [c, c+' ('+cats[c]+')']; }));
    fb.innerHTML = btns.map(function(b){
      return '<button data-f="'+esc(b[0])+'"'+(b[0]===filter?' class="on"':'')+'>'+esc(b[1])+'</button>';
    }).join('');
    fb.addEventListener('click', function(ev){
      var b = ev.target.closest('button'); if(!b) return;
      filter = b.getAttribute('data-f');
      Array.prototype.forEach.call(fb.querySelectorAll('button'), function(x){
        x.classList.toggle('on', x===b); });
      renderErrs();
    });
  }
  renderErrs();

  var mm = el('coachMaterials');
  if (mm) mm.innerHTML = (D.materials||[]).map(function(m){
    var segs = (m.segments||[]).map(function(g){
      var used = g.lesson && g.lesson!=='-';
      var label = esc(g.topic)+' <small style="margin:0;color:#999">'+esc(g.focus)+'</small>';
      var body = m.transcript
        ? '<a href="'+esc(m.transcript+'?seg='+g.seg)+'">'+label+'</a>'
        : '<span>'+label+'</span>';
      return '<div class="coach-lesson"><b>'+g.seg+'</b>'+body+
        '<small>'+esc(g.time)+(used?' &middot; lesson '+esc(g.lesson):'')+'</small></div>';
    }).join('');
    var title = m.transcript
      ? '<a href="'+esc(m.transcript)+'">'+esc(m.title)+'</a>'
      : esc(m.title);
    return '<div class="coach-phase"><b>'+title+'</b>'+
      (m.duration?'<span class="coach-tag">'+esc(m.duration)+'</span>':'')+
      (m.sentences?'<span class="coach-tag">'+m.sentences+' sentences</span>':'')+
      (m.transcript?' <a href="'+esc(m.transcript)+'">transcript</a>':'')+
      (m.url?' &middot; <a href="'+esc(m.url)+'" target="_blank" rel="noopener">watch</a>':'')+
      segs+'</div>';
  }).join('') || '<p>No material yet.</p>';
})();
</script>`;

const MAT_STYLE = `
<style>
.mat-head{display:flex;flex-wrap:wrap;gap:10px;align-items:baseline;margin:.6em 0 1em}
.mat-head .coach-tag{margin-left:0}
.mat-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:1em 0 .4em}
.mat-toolbar input[type=search]{flex:1 1 240px;padding:7px 12px;border:1px solid #dbe3ef;border-radius:8px;font:inherit;background:#fff;color:inherit}
.mat-segs{display:flex;flex-wrap:wrap;gap:8px;margin:.6em 0 1em}
.mat-segs button{padding:5px 12px;border:1px solid #dbe3ef;border-radius:999px;background:#fff;cursor:pointer;font:inherit;font-size:.85em}
.mat-segs button.on{background:#3b82f6;border-color:#3b82f6;color:#fff}
.mat-count{color:#888;font-size:.85em;margin:.2em 0 1em}
.mat-line{display:flex;gap:12px;align-items:flex-start;padding:8px 2px;border-bottom:1px solid #eceff3}
.mat-line.turn{margin-top:10px;border-top:1px solid #e3e8ef;padding-top:14px}
.mat-line .n{color:#aaa;font-variant-numeric:tabular-nums;min-width:3em;text-align:right;font-size:.85em;padding-top:2px}
.mat-line .t{min-width:4.4em;font-size:.85em;font-variant-numeric:tabular-nums;padding-top:2px}
.mat-line .t a{color:#3b82f6;text-decoration:none}
.mat-line .t a:hover{text-decoration:underline}
.mat-line p{margin:0;line-height:1.65}
.mat-line mark{background:#fde68a;color:inherit;padding:0 1px;border-radius:2px}
.mat-seg-head{display:flex;gap:10px;align-items:baseline;margin:1.6em 0 .2em;padding-bottom:6px;border-bottom:2px solid #e3e8ef}
.mat-seg-head b{color:#3b82f6}
.mat-seg-head small{color:#999;margin-left:auto;white-space:nowrap}
html[data-theme="dark"] .mat-toolbar input[type=search],
html[data-theme="dark"] .mat-segs button{background:#20262e;border-color:#333c47;color:#aeb8c2}
html[data-theme="dark"] .mat-segs button.on{background:#6ba3f5;border-color:#6ba3f5;color:#0d1420}
html[data-theme="dark"] .mat-line{border-bottom-color:#2b333c}
html[data-theme="dark"] .mat-line.turn{border-top-color:#2e3640}
html[data-theme="dark"] .mat-seg-head{border-bottom-color:#2e3640}
html[data-theme="dark"] .mat-line mark{background:#8a6d1f;color:#f5f0e0}
</style>`;

const MAT_SCRIPT = `
<script>
(function(){
  var M = window.MATERIAL_DATA || {};
  var lines = M.lines || [], segs = M.segments || [];
  var box = document.getElementById('matLines');
  if (!box) return;
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var state = { q: '', seg: 'all' };

  function segOf(n){
    for (var i=0;i<segs.length;i++){
      var g = segs[i];
      if (g.from && g.to && n >= g.from && n <= g.to) return g;
    }
    return null;
  }
  function link(l){
    if (!M.url) return esc(l.time);
    var sep = M.url.indexOf('?') === -1 ? '?' : '&';
    return '<a href="' + esc(M.url + sep + 't=' + l.sec + 's') +
      '" target="_blank" rel="noopener">' + esc(l.time) + '</a>';
  }
  function highlight(text){
    if (!state.q) return esc(text);
    var q = state.q, out = '', low = text.toLowerCase(), lq = q.toLowerCase(), i = 0;
    while (true){
      var at = low.indexOf(lq, i);
      if (at === -1){ out += esc(text.slice(i)); break; }
      out += esc(text.slice(i, at)) + '<mark>' + esc(text.slice(at, at + q.length)) + '</mark>';
      i = at + q.length;
    }
    return out;
  }

  function render(){
    var q = state.q.toLowerCase();
    var shown = lines.filter(function(l){
      if (state.seg !== 'all'){
        var g = segOf(l.n);
        if (!g || String(g.seg) !== state.seg) return false;
      }
      return !q || l.text.toLowerCase().indexOf(q) !== -1;
    });
    var cnt = document.getElementById('matCount');
    if (cnt) cnt.innerHTML = shown.length + ' of ' + lines.length + ' sentences' +
      (state.q ? ' matching &ldquo;' + esc(state.q) + '&rdquo;' : '');
    if (!shown.length){ box.innerHTML = '<p>No lines match.</p>'; return; }
    var lastSeg = null, html = '';
    shown.forEach(function(l){
      var g = segOf(l.n);
      var key = g ? g.seg : 0;
      if (segs.length && key !== lastSeg){
        lastSeg = key;
        html += g
          ? '<div class="mat-seg-head" id="seg-' + g.seg + '"><b>Seg ' + g.seg + '</b>' +
            '<span>' + esc(g.topic) + '</span><small>' + esc(g.time) + '</small></div>'
          : '<div class="mat-seg-head"><b>&mdash;</b><span>Unsegmented</span></div>';
      }
      html += '<div class="mat-line' + (l.turn ? ' turn' : '') + '" id="s' + l.n + '">' +
        '<span class="n">' + l.n + '.</span>' +
        '<span class="t">' + link(l) + '</span>' +
        '<p>' + (l.turn ? '<b>&raquo;</b> ' : '') + highlight(l.text) + '</p></div>';
    });
    box.innerHTML = html;
  }

  var input = document.getElementById('matSearch');
  if (input){
    var timer = null;
    input.addEventListener('input', function(){
      clearTimeout(timer);
      timer = setTimeout(function(){ state.q = input.value.trim(); render(); }, 250);
    });
  }
  var nav = document.getElementById('matSegs');
  if (nav){
    nav.innerHTML = [['all','All (' + lines.length + ')']].concat(segs.map(function(g){
      return [String(g.seg), 'Seg ' + g.seg + ' \u00b7 ' + g.time];
    })).map(function(b){
      return '<button data-s="' + esc(b[0]) + '"' + (b[0] === state.seg ? ' class="on"' : '') +
        '>' + esc(b[1]) + '</button>';
    }).join('');
    nav.addEventListener('click', function(ev){
      var b = ev.target.closest('button'); if (!b) return;
      state.seg = b.getAttribute('data-s');
      Array.prototype.forEach.call(nav.querySelectorAll('button'), function(x){
        x.classList.toggle('on', x === b); });
      render();
    });
  }
  render();

  // Deep links: /coach/materials/<slug>/?seg=7 or #s203
  var qs = new URLSearchParams(location.search);
  var wantSeg = qs.get('seg');
  if (wantSeg && nav){
    var btn = nav.querySelector('[data-s="' + wantSeg + '"]');
    if (btn) btn.click();
  }
  if (location.hash){
    var target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ block: 'center' });
  }
})();
</script>`;

/**
 * Resolve the material a lesson's `material:` line refers to, plus the segment
 * number if it names one. Matching is by slug tokens appearing in the string
 * (e.g. "Lisa Su @ Stanford GSB, segment 8" -> lisa-su-stanford); when there is
 * only one material with a transcript, fall back to it.
 */
function matchMaterial(materialLine, materials) {
  const withText = materials.filter((m) => m.sentences);
  if (!materialLine || !withText.length) return null;
  const hay = materialLine.toLowerCase();
  let hit = withText.find((m) => {
    const tokens = m.slug.split('-').filter((t) => t.length > 2);
    return tokens.length && tokens.filter((t) => hay.includes(t)).length >= 2;
  });
  if (!hit && withText.length === 1) hit = withText[0];
  if (!hit) return null;
  const seg = /(?:seg|segment)\s*0*(\d+)/i.exec(materialLine);
  return { material: hit, seg: seg ? +seg[1] : null };
}

/** Index page listing every material at coach/materials/. */
function writeMaterialIndex(materials, root) {
  const lines = ['# Material', ''];
  const withText = materials.filter((m) => m.sentences);
  if (!withText.length) {
    lines.push('No transcripts imported yet.');
  } else {
    for (const m of withText) {
      lines.push('- [' + m.title + '](' + m.transcript + ') - ' + m.sentences +
        ' sentences' + (m.duration ? ', ' + m.duration : '') +
        (m.segments.length ? ', ' + m.segments.length + ' segments' : ''));
    }
  }
  lines.push('', '[&larr; back to coach](' + root + 'coach/)', '');
  writeFile(
    path.join(SOURCE, 'coach', 'materials', 'index.md'),
    frontmatter({ title: 'Coach Material', layout: 'page' }) + '\n\n' + lines.join('\n')
  );
}

/** One browsable transcript page per material under coach/materials/<slug>/. */
function writeMaterialPages(materials, root) {
  for (const m of materials) {
    if (!m.lines || !m.lines.length) continue;
    const data = {
      slug: m.slug, title: m.title, url: m.url, duration: m.duration,
      segments: m.segments, lines: m.lines,
    };
    const head = [
      '<div class="mat-head">',
      '<span class="coach-tag">' + m.sentences + ' sentences</span>',
      m.duration ? '<span class="coach-tag">' + m.duration + '</span>' : '',
      m.segments.length ? '<span class="coach-tag">' + m.segments.length + ' segments</span>' : '',
      m.url ? '<a href="' + m.url + '" target="_blank" rel="noopener">watch on source</a>' : '',
      '<a href="' + root + 'coach/">&larr; back to coach</a>',
      '</div>',
    ].filter(Boolean).join('');
    const page = [
      frontmatter({
        title: m.title,
        layout: 'page',
        material_slug: m.slug,
      }),
      '',
      'Full transcript. Timestamps open the source at that sentence; segments come from `series.md`.',
      '',
      DASH_STYLE,
      MAT_STYLE,
      head,
      '<div id="matSegs" class="mat-segs"></div>',
      '<div class="mat-toolbar">',
      '<input type="search" id="matSearch" placeholder="Search this transcript...">',
      '</div>',
      '<p id="matCount" class="mat-count"></p>',
      '<div id="matLines"></div>',
      '',
      '<script>window.MATERIAL_DATA = ' +
        JSON.stringify(data).replace(/</g, '\\u003c') + ';</script>',
      MAT_SCRIPT,
      '',
    ].join('\n');
    writeFile(path.join(SOURCE, 'coach', 'materials', m.slug, 'index.md'), page);
  }
}

function main() {
  ensureClean();
  if (!fs.existsSync(COACH)) {
    console.log('No coach/ directory; nothing to import.');
    return;
  }

  const root = siteRoot();
  const lessons = parseLessons();
  const reviews = parseReviews();
  const errors = parseErrors();
  const plan = parsePlan();
  const materials = parseMaterials(root);

  const lessonMeta = [];
  for (const l of lessons) {
    const url = root + 'coach/lessons/' + l.stem + '/';
    const hit = matchMaterial(l.material, materials);
    const transcript = hit
      ? hit.material.transcript + (hit.seg ? '?seg=' + hit.seg : '')
      : '';
    lessonMeta.push({
      num: l.num, week: l.week, date: l.date, goal: l.goal,
      stage: l.stage, title: l.title, url, turns: l.turns,
      material: l.material, transcript,
    });
    const body = transcript
      ? l.body + '\n\n---\n\nSource transcript: [' + hit.material.title +
        (hit.seg ? ', segment ' + hit.seg : '') + '](' + transcript + ')\n'
      : l.body;
    writeFile(
      path.join(POSTS, 'Coach', 'Lessons', l.stem + '.md'),
      frontmatter({
        title: 'Lesson ' + String(l.num).padStart(2, '0') + ' - ' + (l.goal || l.title),
        date: l.date + ' 09:00:00',
        permalink: 'coach/lessons/' + l.stem + '/',
        lesson_num: l.num,
        lesson_week: l.week,
        lesson_goal: l.goal,
        lesson_material: l.material,
        lesson_stage: l.stage,
      }) + '\n\n' + body + '\n'
    );
  }

  const reviewMeta = [];
  for (const r of reviews) {
    const url = root + 'coach/reviews/' + r.stem + '/';
    reviewMeta.push({ week: r.week, date: r.date, title: r.title, url });
    writeFile(
      path.join(POSTS, 'Coach', 'Reviews', r.stem + '.md'),
      frontmatter({
        title: r.title,
        date: (r.date || '2026-01-01') + ' 09:00:00',
        permalink: 'coach/reviews/' + r.stem + '/',
        review_week: r.week,
      }) + '\n\n' + r.body + '\n'
    );
  }

  writeMaterialPages(materials, root);
  writeMaterialIndex(materials, root);

  // Dashboard data keeps material metadata only; the transcript text itself
  // lives on its own page so coach.json and the dashboard stay small.
  const materialMeta = materials.map((m) => ({
    slug: m.slug, title: m.title, url: m.url, duration: m.duration,
    sentences: m.sentences, transcript: m.transcript, segments: m.segments,
  }));

  const data = { generated: new Date().toISOString(), plan, lessons: lessonMeta,
                 reviews: reviewMeta, errors, materials: materialMeta };
  writeFile(path.join(DATA_DIR, 'coach.json'), JSON.stringify(data, null, 2) + '\n');

  const page = [
    frontmatter({ title: 'English Coach', layout: 'page' }),
    '',
    '12-week English course: lessons, error log with spaced review, and source material.',
    'Generated from `coach/` by `tools/import-coach.js`.',
    '',
    DASH_STYLE,
    '<div id="coachStats" class="coach-grid"></div>',
    '<div id="coachProgress"></div>',
    '',
    '## Phases',
    '<div id="coachPhases"></div>',
    '',
    '## Error Log',
    '',
    'Errors you actually produced, with the natural version. Orange = due for review.',
    '<div id="coachFilters" class="coach-filters"></div>',
    '<div id="coachErrors"></div>',
    '',
    '## Lessons',
    '<div id="coachLessons"></div>',
    '',
    '## Material',
    '',
    'Segment titles link straight into the transcript. ' +
      '[Browse all material](' + root + 'coach/materials/)',
    '<div id="coachMaterials"></div>',
    '',
    '<script>window.COACH_DATA = ' +
      JSON.stringify(data).replace(/</g, '\\u003c') + ';</script>',
    DASH_SCRIPT,
    '',
  ].join('\n');
  writeFile(path.join(SOURCE, 'coach', 'index.md'), page);

  const transcripts = materials.filter((m) => m.sentences);
  const transcriptLines = transcripts.reduce((n, m) => n + m.sentences, 0);
  console.log('Imported ' + lessons.length + ' lesson(s), ' + reviews.length +
    ' review(s), ' + errors.length + ' error(s), ' + materials.length + ' material(s), ' +
    transcripts.length + ' transcript page(s) with ' + transcriptLines + ' sentence(s).');
}

main();

