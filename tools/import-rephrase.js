#!/usr/bin/env node
/**
 * Import rephrase practice content into the Hexo source tree.
 *
 * Reads days/, summaries/, corpus/, and notes/ at the site root and generates:
 *   source/_data/rephrase.json              - data for corpus/notes/hub pages
 *   source/_posts/Rephrase/Days/...         - day posts (frontmatter links to summary)
 *   source/_posts/Rephrase/Summaries/...    - summary posts (frontmatter links to day)
 *   source/rephrase/index.md                - hub page (folder trees)
 *   source/rephrase/corpus/<slug>/index.md  - corpus browser pages
 *   source/notes/index.md                   - notes card page
 *
 * Folder structure under each content area is preserved: days/, summaries/,
 * and corpus/ files may live in nested directories, and the hub trees show
 * exactly that depth (single level when there are no subfolders).
 *
 * Generated output is gitignored and recreated on every build. CI runs this
 * script before `hexo generate`.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'source');
const POSTS = path.join(SOURCE, '_posts');
const DATA_DIR = path.join(SOURCE, '_data');

const GENERATED = [
  path.join(POSTS, 'Rephrase'),
  path.join(SOURCE, 'rephrase'),
  path.join(SOURCE, 'notes'),
  path.join(DATA_DIR, 'rephrase.json'),
];

const DAY_RE = /^day-(\d+)-(\d{8})(?:-(\d+))?\.md$/;
const CORPUS_LINE_RE = /^(\d+)\.\s*\[([EMH])\]\s*(.+?)\s*(?:\|\s*(.*))?$/;
const NOTE_FILE_RE = /^[a-z]+-\d{4}-\d{2}-\d{2}\.md$/;

let DAY_NOTES_MAP = {}; // course -> dayStem -> [day-linked notes]

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function posix(p) {
  return p.split(path.sep).join('/');
}

function readDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return [];
  }
}

function walkFiles(dir) {
  const out = [];
  const stack = [''];
  while (stack.length) {
    const rel = stack.pop();
    const abs = path.join(dir, rel);
    let entries;
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const e of entries) {
      const next = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) stack.push(next);
      else if (e.isFile()) out.push(next);
    }
  }
  return out.sort();
}

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

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
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      lines.push(key + ':');
      for (const item of value) lines.push('  - ' + item);
    } else {
      lines.push(key + ': ' + yamlScalar(value));
    }
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

function relFolder(file) {
  const dir = posix(path.dirname(file));
  return dir === '.' ? '' : dir;
}

function parseDay(course, file) {
  const m = DAY_RE.exec(path.basename(file));
  const stem = path.basename(file).replace(/\.md$/, '');
  const date = fmtDate(m[2]);
  const lines = readText(path.join(ROOT, 'days', course, file)).split(/\r?\n/);
  let title = 'Day ' + m[1];
  let first = true;
  const body = [];
  for (const line of lines) {
    if (line.startsWith('# ') && first) {
      title = line.slice(2).trim();
      first = false;
      continue;
    }
    body.push(line);
  }
  return { stem, dayNum: +m[1], date, title, folder: relFolder(file), body: body.join('\n').trim() };
}

function htmlEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripNotesSection(lines) {
  const out = [];
  let skipping = false;
  for (const line of lines) {
    if (/^##\s*notes from this round/i.test(line.trim())) {
      skipping = true;
      continue;
    }
    if (skipping) {
      if (/^##\s/.test(line.trim())) skipping = false;
      else continue;
    }
    out.push(line);
  }
  return out;
}

function renderReviewCards(rows) {
    return '<div class="review-cards">\n' + rows.map(function (r) {
    const fields = [
      ['中文', r.zh, true],
      ['My rephrase', r.rephrase, false],
      ['Corrected version', r.corrected, false],
      ['Notes', r.notes, false],
      ['Notes 中文', r.notesZh, true]
    ].filter(function (f) { return f[1]; }).map(function (f) {
      return '<div class="review-field' + (f[2] ? ' review-zh' : '') + '"><span class="review-label">' + f[0] + '</span>' +
        '<span class="review-value">' + htmlEscape(f[1]) + '</span></div>';
    }).join('');
    return '<div class="review-card">' +
      '<div class="review-card-head"><span class="review-num">' + r.n + '</span>' +
      '<p class="review-original">' + htmlEscape(r.original) + '</p>' +
      '<button type="button" class="card-zh-toggle" data-card-zh="true">Show 中文</button></div>' +
      (fields ? '<div class="review-card-body">' + fields + '</div>' : '') +
      '</div>';
    }).join('\n') + '\n</div>\n';
}

function parseSummary(course, file) {
  const m = DAY_RE.exec(path.basename(file));
  const stem = path.basename(file).replace(/\.md$/, '');
  const date = fmtDate(m[2]);
  const lines = readText(path.join(ROOT, 'summaries', course, file)).split(/\r?\n/);
  let title = 'Day ' + m[1];
  let first = true;
  const body = [];
  let inReview = false;
  let tableDone = false;
  const rows = [];
  for (const line of lines) {
    if (line.startsWith('# ') && first) {
      title = line.slice(2).trim();
      first = false;
      continue;
    }
    if (!tableDone && /^##\s*the sentences and my rephrases/i.test(line)) {
      inReview = true;
      body.push(line);
      continue;
    }
    if (inReview) {
      if (line.trim().startsWith('|')) {
        const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) { return c.trim(); });
        const isSep = cells.every(function (c) { return /^[\s:-]*$/.test(c); });
        if (cells.length >= 7 && !isSep && /^\d+$/.test(cells[0])) {
          rows.push({ n: cells[0], original: cells[1], zh: cells[2], rephrase: cells[3], corrected: cells[4], notes: cells[5], notesZh: cells[6] });
        }
        continue;
      }
      if (line.trim() === '') continue;
      if (rows.length) body.push(renderReviewCards(rows));
      rows.length = 0;
      inReview = false;
      tableDone = true;
    }
    body.push(line);
  }
  if (inReview && rows.length) body.push(renderReviewCards(rows));
  return { stem, dayNum: +m[1], date, title, folder: relFolder(file), body: stripNotesSection(body).join('\n').trim() };
}

function parseCourseCorpus(course) {
  const dir = path.join(ROOT, 'corpus', course);
  const files = walkFiles(dir).filter((f) => /-clean\.txt$/.test(path.basename(f)));
  if (!files.length) return null;
  const sentences = [];
  const fileMeta = [];
  for (const file of files) {
    let count = 0;
    for (const raw of readText(path.join(dir, file)).split(/\r?\n/)) {
      const m = CORPUS_LINE_RE.exec(raw.trim());
      if (!m) continue;
      sentences.push({
        n: +m[1],
        tag: m[2],
        text: m[3].trim(),
        zh: (m[4] || '').trim(),
        source: posix(file),
        folder: relFolder(file),
      });
      count++;
    }
    fileMeta.push({ file: posix(file), folder: relFolder(file), count });
  }
  return { course, files: fileMeta, sentences };
}

function parseNotes() {
  const notes = [];
  const types = readDir(path.join(ROOT, 'notes')).filter((d) => d.isDirectory());
  for (const type of types) {
    if (type.name === 'rephrase') continue;
    const typeDir = path.join(ROOT, 'notes', type.name);
    for (const f of readDir(typeDir)) {
      if (!f.isFile() || !NOTE_FILE_RE.test(f.name)) continue;
      const content = readText(path.join(typeDir, f.name));
      for (const block of content.split(/\r?\n(?=## )/)) {
        const head = /^##\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/.exec(block);
        if (!head) continue;
        const fields = {};
        const examples = [];
        let inExamples = false;
        for (const raw of block.split(/\r?\n/)) {
          const line = raw.trim();
          if (!line || line.startsWith('##')) continue;
          const kv = /^-\s+\*\*(.+?)\*\*:\s*(.*)$/.exec(line) || /^-\s*([^:]+):\s*(.*)$/.exec(line);
          if (kv) {
            const key = kv[1].trim();
            const value = kv[2].trim();
            if (inExamples) inExamples = false;
            if (/^examples?$/i.test(key)) {
              inExamples = true;
            } else if (value) {
              fields[key] = value;
            }
            continue;
          }
          if (inExamples) {
            const ex = /^-\s+(.+)$/.exec(line);
            if (ex) {
              examples.push(ex[1]);
              continue;
            }
            inExamples = false;
          }
        }
        notes.push({ type: type.name, date: head[1], time: head[2], fields, examples });
      }
    }
  }
  return notes.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

function inferNoteType(fields) {
  if (fields['Word']) return 'define';
  if (fields['Input'] && fields['Output']) return 'translate';
  if (fields['Original'] && fields['Versions']) return 'rephrase';
  if (fields['Sentence 1'] && fields['Sentence 2']) return 'compare';
  if (fields['Sentence']) return 'parse';
  return 'note';
}

function parseDayNotes() {
  const out = [];
  const base = path.join(ROOT, 'notes', 'rephrase');
  for (const dir of readDir(base)) {
    if (!dir.isDirectory()) continue;
    const courseDir = path.join(base, dir.name);
    for (const f of walkFiles(courseDir)) {
      if (!DAY_RE.test(path.basename(f))) continue;
      const dayStem = path.basename(f).replace(/\.md$/, '');
      const content = readText(path.join(courseDir, f));
      for (const block of content.split(/\r?\n(?=## )/)) {
        const head = /^##\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/.exec(block);
        if (!head) continue;
        const fields = {};
        const examples = [];
        let inExamples = false;
        for (const raw of block.split(/\r?\n/)) {
          const line = raw.trim();
          if (!line || line.startsWith('##')) continue;
          const kv = /^-\s+\*\*(.+?)\*\*:\s*(.*)$/.exec(line) || /^-\s*([^:]+):\s*(.*)$/.exec(line);
          if (kv) {
            const key = kv[1].trim();
            const value = kv[2].trim();
            if (inExamples) inExamples = false;
            if (/^examples?$/i.test(key)) {
              inExamples = true;
            } else if (value) {
              fields[key] = value;
            }
            continue;
          }
          if (inExamples) {
            const ex = /^-\s+(.+)$/.exec(line);
            if (ex) {
              examples.push(ex[1]);
              continue;
            }
            inExamples = false;
          }
        }
        out.push({
          type: inferNoteType(fields),
          date: head[1],
          time: head[2],
          fields: Object.assign({ Course: dir.name, Day: dayStem }, fields),
          examples,
          course: dir.name,
          day: dayStem,
        });
      }
    }
  }
  return out.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

function siteRoot() {
  try {
    const cfg = readText(path.join(ROOT, '_config.yml'));
    const m = /^root:\s*["']?([^"'\s]+)["']?\s*$/m.exec(cfg);
    if (m && m[1]) return m[1].replace(/\/?$/, '/');
  } catch (_) {
    /* fall through */
  }
  return '/';
}

function renderDayNotes(notes, stem, root, slug, hasDay, hasSummary) {
  const lines = [];
  lines.push('Day: ' + stem);
  lines.push('');
  lines.push('Entries: ' + notes.length);
  lines.push('');
  const links = [];
  if (hasDay) links.push('[Practice page](' + root + 'rephrase/days/' + slug + '/' + stem + '/)');
  if (hasSummary) links.push('[Summary](' + root + 'rephrase/summaries/' + slug + '/' + stem + '/)');
  if (links.length) {
    lines.push(links.join(' | '));
    lines.push('');
  }
  for (const n of notes) {
    const title = n.fields.Word || n.fields.Sentence || n.fields.Original || (n.type + ' note');
    const titleKey = n.fields.Word ? 'Word' : n.fields.Sentence ? 'Sentence' : n.fields.Original ? 'Original' : '';
    lines.push('## ' + n.type + ': ' + title);
    lines.push('');
    lines.push('_' + n.date + ' ' + n.time + '_');
    lines.push('');
    for (const key of Object.keys(n.fields)) {
      if (key === 'Course' || key === 'Day' || key === titleKey || /^examples?$/i.test(key)) continue;
      lines.push('- **' + key + '**: ' + n.fields[key]);
    }
    if (n.examples && n.examples.length) {
      lines.push('- **Examples**:');
      for (const ex of n.examples) lines.push('  - ' + ex);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

function buildCourse(course) {
  const slug = slugify(course);
  const root = siteRoot();
  const days = walkFiles(path.join(ROOT, 'days', course))
    .filter((f) => DAY_RE.test(path.basename(f)));
  const summaries = walkFiles(path.join(ROOT, 'summaries', course))
    .filter((f) => DAY_RE.test(path.basename(f)));
  const dayNotesForCourse = DAY_NOTES_MAP[course] || {};

  const dayPosts = days.map((file) => {
    const p = parseDay(course, file);
    p.hasSummary = summaries.includes(file);
    p.summary_path = p.hasSummary ? 'rephrase/summaries/' + slug + '/' + p.stem + '/' : undefined;
    const notesForDay = dayNotesForCourse[p.stem];
    let body = p.body;
    if (notesForDay && notesForDay.length) {
      body = body + '\n\n## Notes\n\n[Day notes](' + root + 'rephrase/notes/' + slug + '/' + p.stem + '/)';
    }
    writeFile(
      path.join(POSTS, 'Rephrase', 'Days', course, posix(path.dirname(file)), p.stem + '.md'),
      frontmatter({
        title: p.title,
        date: p.date + ' 12:00:00',
        permalink: 'rephrase/days/' + slug + '/' + p.stem + '/',
        day_num: p.dayNum,
        tags: ['Rephrase', 'Days'],
        summary_path: p.summary_path,
      }) + '\n\n' + body + '\n'
    );
    return p;
  });

  const summaryPosts = summaries.map((file) => {
    const p = parseSummary(course, file);
    p.hasDay = days.includes(file);
    p.day_path = p.hasDay ? 'rephrase/days/' + slug + '/' + p.stem + '/' : undefined;
    const notesForDay = dayNotesForCourse[p.stem];
    let body = p.body;
    if (notesForDay && notesForDay.length) {
      const lines = [
        '## Notes from This Round',
        '',
        '[Open the day notes page](' + root + 'rephrase/notes/' + slug + '/' + p.stem + '/)',
        '',
      ];
      for (const n of notesForDay) {
        const title = n.fields.Word || n.fields.Sentence || n.fields.Original || (n.type + ' note');
        lines.push('- [' + n.type + '] ' + title + ' (' + n.date + ' ' + n.time + ')');
      }
      body = body + '\n\n' + lines.join('\n');
    }
    writeFile(
      path.join(POSTS, 'Rephrase', 'Summaries', course, posix(path.dirname(file)), p.stem + '.md'),
      frontmatter({
        title: p.title,
        date: p.date + ' 12:00:00',
        permalink: 'rephrase/summaries/' + slug + '/' + p.stem + '/',
        day_num: p.dayNum,
        tags: ['Rephrase', 'Summaries'],
        day_path: p.day_path,
        zh_toggle: true,
      }) + '\n\n' + body + '\n'
    );
    return p;
  });

  const notesPosts = [];
  for (const stem of Object.keys(dayNotesForCourse)) {
    const notes = dayNotesForCourse[stem];
    if (!notes || !notes.length) continue;
    const m = DAY_RE.exec(stem + '.md');
    if (!m) continue;
    const dayFile = days.find((f) => path.basename(f).replace(/\.md$/, '') === stem);
    const folder = dayFile ? posix(path.dirname(dayFile)) : '';
    const hasDay = days.includes(dayFile);
    const hasSummary = summaries.includes(dayFile);
    const body = renderDayNotes(notes, stem, root, slug, hasDay, hasSummary);
    writeFile(
      path.join(POSTS, 'Rephrase', 'Notes', course, folder, stem + '.md'),
      frontmatter({
        title: 'Day ' + parseInt(m[1], 10) + ' Notes - ' + course,
        date: fmtDate(m[2]) + ' 12:00:00',
        permalink: 'rephrase/notes/' + slug + '/' + stem + '/',
        day_num: +m[1],
        tags: ['Rephrase', 'Notes'],
        day_path: hasDay ? 'rephrase/days/' + slug + '/' + stem + '/' : undefined,
        summary_path: hasSummary ? 'rephrase/summaries/' + slug + '/' + stem + '/' : undefined,
      }) + '\n\n' + body + '\n'
    );
    notesPosts.push({ stem, dayNum: +m[1], date: fmtDate(m[2]) });
  }

  return {
    name: course,
    slug,
    days: dayPosts,
    summaries: summaryPosts,
    notes: notesPosts,
    corpus: parseCourseCorpus(course),
  };
}

function addTreeNode(nodes, segments, leaf) {
  let level = nodes;
  for (const seg of segments) {
    let node = level.find((n) => n.name === seg && n.children);
    if (!node) {
      node = { name: seg, children: [] };
      level.push(node);
    }
    level = node.children;
  }
  level.push(leaf);
}

function sortTree(nodes, leafByDate) {
  nodes.sort((a, b) => {
    const af = !!a.children;
    const bf = !!b.children;
    if (af !== bf) return af ? -1 : 1;
    if (af) return (a.name || '').localeCompare(b.name || '');
    if (leafByDate) return (b.date || '').localeCompare(a.date || '');
    return (a.name || '').localeCompare(b.name || '');
  });
  for (const n of nodes) {
    if (n.children) sortTree(n.children, leafByDate);
  }
}

function buildTrees(courses, root) {
  const trees = { corpus: [], days: [], summaries: [] };
  for (const c of courses) {
    if (c.corpus) {
      for (const f of c.corpus.files) {
        const segments = [c.name].concat(f.folder ? f.folder.split('/') : []);
        addTreeNode(trees.corpus, segments, {
          name: f.file.replace(/-clean\.txt$/i, ''),
          url: root + 'rephrase/corpus/' + c.slug + '/' + slugify(f.file.replace(/-clean\.txt$/i, '')) + '/',
          count: f.count,
        });
      }
    }
    for (const d of c.days) {
      const segments = [c.name].concat(d.folder ? d.folder.split('/') : []);
      addTreeNode(trees.days, segments, {
        name: 'Day ' + d.dayNum,
        url: root + 'rephrase/days/' + c.slug + '/' + d.stem + '/',
        date: d.date,
      });
    }
    for (const s of c.summaries) {
      const segments = [c.name].concat(s.folder ? s.folder.split('/') : []);
      addTreeNode(trees.summaries, segments, {
        name: 'Day ' + s.dayNum + ' Summary',
        url: root + 'rephrase/summaries/' + c.slug + '/' + s.stem + '/',
        date: s.date,
      });
    }
  }
  sortTree(trees.corpus, false);
  sortTree(trees.days, true);
  sortTree(trees.summaries, true);
  return trees;
}

function main() {
  ensureClean();
  const courses = [];
  const names = new Set();
  for (const dirName of ['days', 'summaries', 'corpus']) {
    for (const dir of readDir(path.join(ROOT, dirName))) {
      if (dir.isDirectory()) names.add(dir.name);
    }
  }
  const dayNotes = parseDayNotes();
  DAY_NOTES_MAP = {};
  for (const n of dayNotes) {
    DAY_NOTES_MAP[n.course] = DAY_NOTES_MAP[n.course] || {};
    DAY_NOTES_MAP[n.course][n.day] = DAY_NOTES_MAP[n.course][n.day] || [];
    DAY_NOTES_MAP[n.course][n.day].push(n);
  }
  for (const name of [...names].sort()) courses.push(buildCourse(name));

  const root = siteRoot();
  const corpusMap = {};
  for (const c of courses) {
    if (!c.corpus) continue;
    corpusMap[c.slug] = c.corpus;
    const listLines = ['# ' + c.name + ' - Corpus', ''];
    for (const cf of c.corpus.files) {
      const fileSlug = slugify(cf.file.replace(/-clean\.txt$/i, ''));
      writeFile(
        path.join(SOURCE, 'rephrase', 'corpus', c.slug, fileSlug, 'index.md'),
        frontmatter({
          title: cf.file.replace(/-clean\.txt$/i, ''),
          layout: 'corpus',
          corpus_key: c.slug,
          corpus_file: cf.file,
        }) + '\n'
      );
      listLines.push('- [' + cf.file.replace(/-clean\.txt$/i, '') + '](' + root + 'rephrase/corpus/' + c.slug + '/' + fileSlug + '/)');
    }
    listLines.push('');
    writeFile(
      path.join(SOURCE, 'rephrase', 'corpus', c.slug, 'index.md'),
      frontmatter({ title: c.name + ' - Corpus', layout: 'page' }) + '\n\n' + listLines.join('\n') + '\n'
    );
  }

  writeFile(
    path.join(SOURCE, 'rephrase', 'index.md'),
    frontmatter({ title: 'Rephrase Practice', layout: 'rephrase' }) + '\n'
  );

  writeFile(
    path.join(SOURCE, 'notes', 'index.md'),
    frontmatter({ title: 'Language Notes', layout: 'notes' }) + '\n'
  );

  const notes = parseNotes().concat(dayNotes);
  writeFile(
    path.join(DATA_DIR, 'rephrase.json'),
    JSON.stringify({
      generated: new Date().toISOString(),
      courses: courses.map((c) => ({ name: c.name, slug: c.slug, days: c.days.length, summaries: c.summaries.length })),
      corpus: corpusMap,
      trees: buildTrees(courses, root),
      notes,
    }, null, 2) + '\n'
  );

  const dayTotal = courses.reduce((n, c) => n + c.days.length, 0);
  const summaryTotal = courses.reduce((n, c) => n + c.summaries.length, 0);
  console.log(
    'Imported ' + courses.length + ' course(s), ' + dayTotal + ' day(s), ' +
    summaryTotal + ' summary(s), ' + notes.length + ' note(s).'
  );
}

main();
