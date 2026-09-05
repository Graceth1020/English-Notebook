#!/usr/bin/env node
/**
 * Build the Learning hub, the site's front page, from the other importers'
 * output.
 *
 * The nav had grown one tab per skill (Coach, Chat, Patterns, Form, Rephrase,
 * Notes) which is one tab per implementation detail rather than per user
 * intent. They are now grouped under a single "Learning" menu, and this hub is
 * where the site opens: one card per track, with the numbers that answer
 * "where am I and what is due today" without opening five dashboards.
 *
 * It writes source/index.md, i.e. the root URL, rather than a /learning page.
 * The root previously held a second copy of the tag tree that /tags already
 * serves, so the landing page was spending the most valuable URL on a
 * duplicate. Because the file is generated it is gitignored like every other
 * importer output - a checkout that has not run `npm run import` has no home
 * page, which is the same deal the track dashboards already make.
 *
 * Unlike the other importers this one does NOT parse the markdown sources. It
 * reads source/_data/*.json, which the other importers have already written, so
 * a stat shown here can never disagree with the same stat on the track's own
 * dashboard. The cost is ordering: this must run last. npm scripts and CI do
 * that, and a missing/stale JSON degrades to a card without stats rather than
 * an error.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'source');
const DATA_DIR = path.join(SOURCE, '_data');

const GENERATED = [
  path.join(SOURCE, 'index.md'),
  // The hub used to live at /learning. Keep deleting that directory so a tree
  // built before the move does not keep serving a stale second copy.
  path.join(SOURCE, 'learning'),
  path.join(DATA_DIR, 'learning.json'),
];

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

function readData(name) {
  const p = path.join(DATA_DIR, name + '.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn('learning: ignoring unreadable ' + name + '.json (' + e.message + ')');
    return null;
  }
}

function siteRoot() {
  try {
    const m = /^root:\s*(\S+)/m.exec(fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8'));
    if (m) return m[1].replace(/^["']|["']$/g, '');
  } catch (_) { /* ignore */ }
  return '/';
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

const TODAY = new Date().toISOString().slice(0, 10);

function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')); }

/** Rows whose `next` review date has arrived and that are not yet resolved. */
function dueCount(rows, statusKey) {
  return (rows || []).filter((r) => {
    const status = String(r[statusKey || 'status'] || '');
    if (/^(resolved|owned|done)$/i.test(status)) return false;
    return isDate(r.next) && r.next <= TODAY;
  }).length;
}

function openCount(rows) {
  return (rows || []).filter((r) => !/^(resolved|owned|done)$/i.test(String(r.status || ''))).length;
}

function latestDate(rows, key) {
  const dates = (rows || []).map((r) => r[key || 'date']).filter(isDate).sort();
  return dates.length ? dates[dates.length - 1] : '';
}

/**
 * One card per track. `stats` are the two or three numbers that tell the
 * learner where the track stands; `due` drives the badge, so only tracks with
 * a real spaced-review schedule set it.
 */
function buildTracks(root) {
  const coach = readData('coach');
  const chat = readData('chat');
  const patterns = readData('patterns');
  const form = readData('form');
  const rephrase = readData('rephrase');

  const tracks = [];

  if (chat) {
    const chunksOwned = (chat.chunks || []).filter(
      (c) => /^owned$/i.test(String(c.status || ''))).length;
    tracks.push({
      key: 'chat',
      name: 'Daily Chat',
      url: root + 'chat/',
      blurb: 'One small-talk topic a day, corrected as it goes.',
      last: latestDate(chat.days, 'date'),
      due: dueCount(chat.errors),
      stats: [
        { label: 'Sessions', value: (chat.days || []).length },
        { label: 'Chunks tracked', value: (chat.chunks || []).length },
        { label: 'Chunks owned', value: chunksOwned },
        { label: 'Open errors', value: openCount(chat.errors) },
      ],
    });
  }

  if (coach) {
    const phases = (coach.plan && coach.plan.phases) || [];
    const active = phases.find((p) => /progress/i.test(String(p.status || '')));
    tracks.push({
      key: 'coach',
      name: 'Coach',
      url: root + 'coach/',
      blurb: '12-week course: one goal per lesson, built on real material.',
      last: latestDate(coach.lessons, 'date'),
      due: dueCount(coach.errors),
      note: active ? 'Phase ' + active.phase + ' - ' + active.theme : '',
      stats: [
        { label: 'Lessons', value: (coach.lessons || []).length },
        { label: 'Open errors', value: openCount(coach.errors) },
        { label: 'Material', value: (coach.materials || []).length },
      ],
      links: (coach.materials || [])
        .filter((m) => m.transcript)
        .map((m) => ({ label: 'Transcript: ' + m.title, url: m.transcript })),
    });
  }

  if (patterns) {
    const inv = patterns.inventory || [];
    tracks.push({
      key: 'patterns',
      name: 'Patterns',
      url: root + 'patterns/',
      blurb: 'Sentence structures that seeding cannot reach, drilled one at a time.',
      last: latestDate(patterns.drills, 'date'),
      due: dueCount(inv),
      stats: [
        { label: 'Drills', value: (patterns.drills || []).length },
        { label: 'In inventory', value: inv.length },
        { label: 'Drilled', value: inv.filter((p) => /drilled/i.test(String(p.status || ''))).length },
      ],
    });
  }

  if (form) {
    const drills = form.drills || [];
    const clean = drills.reduce((n, d) => n + (+d.clean || 0), 0);
    const total = drills.reduce((n, d) => n + (+d.total || 0), 0);
    tracks.push({
      key: 'form',
      name: 'Form Drills',
      url: root + 'form/',
      blurb: 'Accuracy under content pressure: tense, article, verb form.',
      last: latestDate(drills, 'date'),
      due: 0,
      stats: [
        { label: 'Drills', value: drills.length },
        { label: 'Clean axes', value: total ? clean + '/' + total : 0 },
        { label: 'Axes', value: (form.axes || []).length },
      ],
    });
  }

  if (rephrase) {
    const courses = rephrase.courses || [];
    const days = courses.reduce((n, c) => n + (+c.days || 0), 0);
    const corpusLines = Object.values(rephrase.corpus || {}).reduce(
      (n, c) => n + ((c && c.files) || []).reduce((m, f) => m + (+f.count || 0), 0), 0);
    // Day pages are the practice record; their dates live in the hub trees.
    const lastDay = (function walk(nodes) {
      let best = '';
      for (const node of nodes || []) {
        const found = node.children ? walk(node.children) : (isDate(node.date) ? node.date : '');
        if (found > best) best = found;
      }
      return best;
    })((rephrase.trees || {}).days);
    tracks.push({
      key: 'rephrase',
      name: 'Rephrase',
      url: root + 'rephrase/',
      blurb: 'Rewrite subtitle lines in your own words, ten a day.',
      last: lastDay,
      due: 0,
      stats: [
        { label: 'Courses', value: courses.length },
        { label: 'Days', value: days },
        { label: 'Corpus lines', value: corpusLines },
      ],
      links: courses.map((c) => ({
        label: c.name + ' corpus',
        url: root + 'rephrase/corpus/' + c.slug + '/',
      })),
    });

    tracks.push({
      key: 'notes',
      name: 'Language Notes',
      url: root + 'notes/',
      blurb: 'One-off lookups: translate, define, parse, compare.',
      last: latestDate(rephrase.notes, 'date'),
      due: 0,
      stats: [{ label: 'Entries', value: (rephrase.notes || []).length }],
    });
  }

  return tracks;
}

const STYLE = `
<style>
.lh-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin:1.4em 0}
.lh-sum div{border:1px solid #e3e8ef;border-radius:10px;padding:14px 16px;background:#fff}
.lh-sum b{display:block;font-size:1.9em;line-height:1.1;color:#3b82f6}
.lh-sum span{font-size:.82em;color:#888;text-transform:uppercase;letter-spacing:.04em}
.lh-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(272px,1fr));gap:16px;margin:1.2em 0}
.lh-card{display:flex;flex-direction:column;border:1px solid #e3e8ef;border-radius:12px;padding:16px 18px;background:#fff}
.lh-card h3{margin:0 0 2px;font-size:1.1em}
.lh-card h3 a{text-decoration:none}
.lh-card .blurb{color:#777;font-size:.88em;margin:0 0 12px;line-height:1.5}
.lh-card .note{font-size:.82em;color:#4338ca;background:#eef2ff;border-radius:6px;padding:4px 8px;margin:0 0 10px;display:inline-block}
.lh-nums{display:flex;flex-wrap:wrap;gap:14px;margin-top:auto}
.lh-nums div{min-width:64px}
.lh-nums b{display:block;font-size:1.35em;color:#1a1a1a}
.lh-nums span{font-size:.72em;color:#999;text-transform:uppercase;letter-spacing:.04em}
.lh-foot{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid #eef1f5;font-size:.8em;color:#999}
.lh-foot a{font-size:1em}
.lh-badge{display:inline-block;font-size:.72em;font-weight:700;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#4338ca;margin-left:6px;vertical-align:middle}
.lh-badge.due{background:#fef3c7;color:#92400e}
html[data-theme="dark"] .lh-sum div,html[data-theme="dark"] .lh-card{background:#1d232b;border-color:#2e3640}
html[data-theme="dark"] .lh-nums b{color:#e8edf2}
html[data-theme="dark"] .lh-foot{border-top-color:#2b333c}
html[data-theme="dark"] .lh-card .note{background:#252c38;color:#a5b4fc}
html[data-theme="dark"] .lh-badge{background:#252c38;color:#a5b4fc}
html[data-theme="dark"] .lh-badge.due{background:#4a3410;color:#fcd34d}
</style>`;

const SCRIPT = `
<script>
(function(){
  var D = window.LEARNING_DATA || {};
  var tracks = D.tracks || [];
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var el = function(id){ return document.getElementById(id); };

  var totalDue = tracks.reduce(function(n,t){ return n + (t.due||0); }, 0);
  var lastDates = tracks.map(function(t){ return t.last; }).filter(Boolean).sort();
  var s = el('lhSummary');
  if (s) s.innerHTML =
    '<div><b>'+tracks.length+'</b><span>Tracks</span></div>'+
    '<div><b>'+totalDue+'</b><span>Due for review</span></div>'+
    '<div><b>'+esc(lastDates.length?lastDates[lastDates.length-1]:'-')+'</b><span>Last practice</span></div>';

  var box = el('lhTracks');
  if (!box) return;
  box.innerHTML = tracks.map(function(t){
    var nums = (t.stats||[]).map(function(x){
      return '<div><b>'+esc(x.value)+'</b><span>'+esc(x.label)+'</span></div>';
    }).join('');
    var links = (t.links||[]).slice(0,3).map(function(l){
      return '<a href="'+esc(l.url)+'">'+esc(l.label)+'</a>';
    }).join('');
    return '<div class="lh-card">'+
      '<h3><a href="'+esc(t.url)+'">'+esc(t.name)+'</a>'+
        (t.due?'<span class="lh-badge due">'+t.due+' due</span>':'')+'</h3>'+
      '<p class="blurb">'+esc(t.blurb)+'</p>'+
      (t.note?'<p class="note">'+esc(t.note)+'</p>':'')+
      '<div class="lh-nums">'+nums+'</div>'+
      '<div class="lh-foot">'+
        (t.last?'<span>last '+esc(t.last)+'</span>':'<span>&nbsp;</span>')+
        links+
      '</div>'+
    '</div>';
  }).join('') || '<p>No tracks yet - run the importers.</p>';
})();
</script>`;

function main() {
  ensureClean();
  const root = siteRoot();
  const tracks = buildTracks(root);
  const data = { generated: new Date().toISOString(), tracks };

  writeFile(path.join(DATA_DIR, 'learning.json'), JSON.stringify(data, null, 2) + '\n');

  const page = [
    frontmatter({ title: 'Learning', layout: 'page' }),
    '',
    'Every practice track in one place. Each card links to that track\'s own',
    'dashboard; the numbers come straight from the same data those dashboards use.',
    '',
    STYLE,
    '<div id="lhSummary" class="lh-sum"></div>',
    '',
    '## Tracks',
    '<div id="lhTracks" class="lh-grid"></div>',
    '',
    '<script>window.LEARNING_DATA = ' +
      JSON.stringify(data).replace(/</g, '\\u003c') + ';</script>',
    SCRIPT,
    '',
  ].join('\n');
  writeFile(path.join(SOURCE, 'index.md'), page);

  const due = tracks.reduce((n, t) => n + (t.due || 0), 0);
  console.log('Learning hub: ' + tracks.length + ' track(s), ' + due + ' item(s) due.');
}

main();
