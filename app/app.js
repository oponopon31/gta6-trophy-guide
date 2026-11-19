// Leonida Platinum: offline GTA VI trophy tracker.
// Loads app/data/trophies.json (the official 55, with my own cited guides), keeps
// earned ticks in localStorage, exports/imports progress as a file, filters by kind
// and grade, and hides story-trophy spoilers until they are earned.
const KEY = 'gta6-trophy-checklist-v1';
const SPOILER_KEY = 'gta6-trophy-spoiler-v1';
const rowsEl = document.getElementById('rows');
const detailEl = document.getElementById('detail');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const showEl = document.getElementById('show');
const spoilerEl = document.getElementById('spoiler');
const statusEl = document.getElementById('statusline');
const params = new URLSearchParams(location.search);

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let spoiler = localStorage.getItem(SPOILER_KEY) === '1' || params.get('spoiler') === 'on';
let kind = params.get('kind') || 'all';
let selected = null;

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

// Demo/share state from the URL: ?seed=1,2,3 earns those ids, ?open=28 opens a guide.
if (params.get('seed')) {
  for (const n of params.get('seed').split(',')) {
    const t = trophies.find((x) => x.id === Number(n));
    if (t) earned.add(t.name);
  }
  save();
}
if (params.get('open')) selected = trophies.find((x) => x.id === Number(params.get('open'))) || null;
if (params.get('grade')) gradeEl.value = params.get('grade');
if (params.get('show')) showEl.value = params.get('show');
if (!selected) selected = trophies[0];

function save() { localStorage.setItem(KEY, JSON.stringify([...earned])); }
function saveSpoiler() { localStorage.setItem(SPOILER_KEY, spoiler ? '1' : '0'); }
function isStory(t) { return t.kind === 'story' || t.kind === 'side'; }
function hiddenBySpoiler(t) { return spoiler && isStory(t) && !earned.has(t.name); }
function gradeLabel(t) { return t.grade[0].toUpperCase() + t.grade.slice(1); }
function kindLabel(t) {
  if (t.kind === 'platinum') return 'Platinum';
  return t.kind[0].toUpperCase() + t.kind.slice(1);
}

function matches(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.guide || '').toLowerCase().includes(q))) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (showEl.value === 'earned' && !earned.has(t.name)) return false;
  if (showEl.value === 'remaining' && earned.has(t.name)) return false;
  if (kind === 'online') return false;
  if (kind === 'missable') return !!t.missable;
  if (kind !== 'all' && t.kind !== kind) return false;
  return true;
}

function renderList() {
  const list = trophies.filter(matches);
  document.getElementById('shownCount').textContent = kind === 'online'
    ? '0 trophies — GTA VI has no online trophies (all 55 are single-player)'
    : `${list.length} of 55 trophies`;
  rowsEl.replaceChildren();
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'row';
    li.textContent = kind === 'online'
      ? 'No online trophies: every one of the 55 is earned in single-player. Pick another filter.'
      : 'No trophies match these filters.';
    rowsEl.append(li);
    return;
  }
  for (const t of list) {
    const li = document.createElement('li');
    li.className = 'row' + (earned.has(t.name) ? ' earned' : '') + (selected === t ? ' sel' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      save(); renderAll();
    });
    box.addEventListener('click', (e) => e.stopPropagation());
    const mid = document.createElement('div');
    const nm = document.createElement('div');
    nm.className = 'nm';
    nm.textContent = hiddenBySpoiler(t) ? 'Hidden story trophy — earn it to reveal' : t.name;
    const ds = document.createElement('div');
    ds.className = 'ds';
    ds.textContent = hiddenBySpoiler(t) ? 'Spoiler hidden until earned.' : t.description;
    const tags = document.createElement('div');
    tags.className = 'tags';
    for (const [txt, cls] of [[gradeLabel(t), 'g-' + t.grade], [kindLabel(t), ''], ...(t.missable ? [['⚠ MISSABLE', 'miss']] : []), ...(t.hidden ? [['Hidden', 'hidden']] : []), ...(earned.has(t.name) ? [['✓ Earned', 'earned']] : [])]) {
      const s = document.createElement('span');
      s.className = 'tag ' + cls;
      s.textContent = txt;
      tags.append(s);
    }
    mid.append(nm, ds, tags);
    const pts = document.createElement('div');
    pts.className = 'pts';
    pts.textContent = (t.target ? 'Target: ' + t.target.toLocaleString() : '') + (t.target ? '\n' : '') + '#' + t.id;
    li.append(box, mid, pts);
    li.addEventListener('click', () => { selected = t; renderAll(); });
    rowsEl.append(li);
  }
}

function renderDetail() {
  const t = selected;
  detailEl.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = hiddenBySpoiler(t) ? 'Hidden story trophy' : t.name;
  const d = document.createElement('p');
  d.className = 'desc';
  d.textContent = hiddenBySpoiler(t) ? 'Spoiler hidden — earn this trophy to reveal its name and description.' : '“' + t.description + '”';
  const meta = document.createElement('div');
  meta.className = 'meta';
  for (const [txt, cls] of [[gradeLabel(t), 'g-' + t.grade], [kindLabel(t), ''], ...(t.missable ? [['⚠ MISSABLE — do it in Chapter 1', 'miss']] : []), ...(t.hidden ? [['Hidden on PSN until earned', 'hidden']] : []), [earned.has(t.name) ? '✓ Earned' : 'Not yet earned', earned.has(t.name) ? 'earned' : '']]) {
    const s = document.createElement('span');
    s.className = 'tag ' + cls;
    s.textContent = txt;
    meta.append(s);
  }
  detailEl.append(h, d, meta);
  if (t.missable) {
    const w = document.createElement('p');
    w.className = 'warn';
    w.textContent = '⚠ MISSABLE: the Chapter 1 balcony meditation may be required. Do it before Chapter 1 ends and keep a manual save at the start of Chapter 1.';
    detailEl.append(w);
  }
  if (hiddenBySpoiler(t)) {
    const p = document.createElement('p');
    p.className = 'ok';
    p.textContent = 'Turn off “Hide story spoilers” above to read this guide, or tick the trophy earned to reveal it.';
    detailEl.append(p);
    return;
  }
  const g = document.createElement('p');
  g.className = 'guide';
  g.textContent = t.guide;
  detailEl.append(g);
  const sh = document.createElement('h3');
  sh.textContent = 'Sources — where each fact comes from';
  const ul = document.createElement('ul');
  for (const s of t.sources || []) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    li.append(a);
    ul.append(li);
  }
  detailEl.append(sh, ul);
  const note = document.createElement('p');
  note.className = 'fine';
  note.textContent = 'Guide written in my own words for this entry. Official name, description and grade are shown as PlayStation publishes them (Exophase / PSNProfiles).';
  detailEl.append(note);
}

function renderProgress() {
  document.getElementById('earnedCount').textContent = earned.size;
  document.getElementById('barFill').style.width = (earned.size / trophies.length * 100) + '%';
}

function renderAll() { renderList(); renderDetail(); renderProgress(); }

document.querySelectorAll('#kindChips .chip').forEach((c) => {
  if (c.dataset.kind === kind) c.classList.add('on'); else if (kind === 'all') c.classList.toggle('on', c.dataset.kind === 'all');
  c.addEventListener('click', () => {
    kind = c.dataset.kind;
    document.querySelectorAll('#kindChips .chip').forEach((x) => x.classList.toggle('on', x === c));
    renderAll();
  });
});
searchEl.addEventListener('input', renderAll);
gradeEl.addEventListener('change', renderAll);
showEl.addEventListener('change', renderAll);
spoilerEl.checked = spoiler;
spoilerEl.addEventListener('change', () => { spoiler = spoilerEl.checked; saveSpoiler(); renderAll(); });

document.getElementById('export').addEventListener('click', () => {
  const data = { app: 'leonida-platinum', game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...earned] };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
  statusEl.textContent = 'Exported ' + earned.size + ' earned trophies to gta6-trophy-progress.json.';
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => known.has(n)));
    save(); renderAll();
    statusEl.textContent = 'Imported ' + earned.size + ' earned trophies from ' + file.name + '.';
  } catch (err) {
    statusEl.textContent = 'Import failed: that file is not a progress export from this tracker.';
  }
  e.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned ticks? Export first if you want a backup.')) return;
  earned = new Set(); save(); renderAll();
  statusEl.textContent = 'Progress cleared.';
});
document.querySelectorAll('.tab').forEach((a) => a.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === a));
}));

renderAll();
