// Leonida Atlas — GTA VI trophy guide and tracker.
// Checklist ticks persist in localStorage; export/import moves them between devices.
// Every guide step carries its source; the audit bar counts are computed from the data.
const KEY = 'gta6-trophy-checklist-v9';
const STEP_KEY = 'gta6-trophy-steps-v9';
const rowsEl = document.getElementById('rows');
const gradeEl = document.getElementById('grade');
const categoryEl = document.getElementById('category');
const searchEl = document.getElementById('search');
const spoilerEl = document.getElementById('spoiler');
const unearnedEl = document.getElementById('only-open');
const params = new URLSearchParams(location.search);

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let doneSteps = new Set(JSON.parse(localStorage.getItem(STEP_KEY) ?? '[]'));
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

const MARKERS = [
  { x: 82, y: 62, trophy: 44, label: 'Ocean Beach — cocktail with a view' },
  { x: 74, y: 18, trophy: 37, label: 'VCIA Airport — unscheduled departure' },
  { x: 66, y: 46, trophy: 5, label: 'Vice City — Chapter 3' },
  { x: 88, y: 86, trophy: 42, label: 'Leonida Keys — explore all 52 areas' },
  { x: 48, y: 55, trophy: 46, label: 'Kolt & Associates bowling alley' },
  { x: 38, y: 40, trophy: 45, label: 'Vehicle showroom — smash out' },
  { x: 22, y: 62, trophy: 17, label: 'Shooting Range — 42 golds' },
  { x: 14, y: 84, trophy: 20, label: 'Fishing spot — beat Cal' },
  { x: 58, y: 28, trophy: 39, label: 'Jewelry store — rob undetected' },
  { x: 30, y: 16, trophy: 28, label: 'Meditation grove — 18 spots (missable)' },
];

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
  localStorage.setItem(STEP_KEY, JSON.stringify([...doneSteps]));
}

function dots(n) {
  return '●'.repeat(n) + '○'.repeat(Math.max(0, 5 - n));
}

function buildMap() {
  const map = document.getElementById('map');
  const lands = [
    { left: '52%', top: '8%', width: '42%', height: '72%' },
    { left: '6%', top: '6%', width: '38%', height: '52%' },
    { left: '70%', top: '80%', width: '24%', height: '14%' },
  ];
  for (const l of lands) {
    const d = document.createElement('div');
    d.className = 'land';
    Object.assign(d.style, { left: l.left, top: l.top, width: l.width, height: l.height });
    map.append(d);
  }
  const sea = document.createElement('span');
  sea.className = 'sea-label';
  sea.textContent = 'Atlantic Ocean';
  Object.assign(sea.style, { left: '84%', top: '6%' });
  map.append(sea);
  const landLabel = document.createElement('span');
  landLabel.className = 'land-label';
  landLabel.textContent = 'Vice City';
  Object.assign(landLabel.style, { left: '60%', top: '38%' });
  map.append(landLabel);
  const landLabel2 = document.createElement('span');
  landLabel2.className = 'land-label';
  landLabel2.textContent = 'Leonida mainland';
  Object.assign(landLabel2.style, { left: '10%', top: '30%' });
  map.append(landLabel2);
  const compass = document.createElement('div');
  compass.className = 'compass';
  map.append(compass);
  const legend = document.getElementById('legend');
  for (const m of MARKERS) {
    const t = trophies.find((x) => x.id === m.trophy);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'marker';
    b.style.left = m.x + '%';
    b.style.top = m.y + '%';
    b.textContent = String(m.trophy);
    b.setAttribute('aria-label', m.label);
    const tip = document.createElement('span');
    tip.className = 'tip';
    tip.textContent = m.label;
    b.append(tip);
    b.addEventListener('click', () => openGuide(m.trophy, true));
    map.append(b);
    const li = document.createElement('li');
    li.innerHTML = '';
    const num = document.createElement('b');
    num.textContent = String(m.trophy) + ' — ';
    li.append(num, document.createTextNode(m.label + (t ? ' · ' + t.name : '')));
    legend.append(li);
  }
}

function buildGradebar() {
  const bar = document.getElementById('gradebar');
  const counts = {};
  for (const t of trophies) counts[t.grade] = (counts[t.grade] ?? 0) + 1;
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const seg = document.createElement('div');
    seg.className = 'grade-seg ' + g;
    const pct = counts[g] / trophies.length * 100;
    seg.style.width = pct + '%';
    seg.textContent = pct >= 7 ? g + ' ' + counts[g] : '';
    seg.title = g + ' ' + counts[g];
    bar.append(seg);
  }
  document.getElementById('audit-steps').textContent =
    trophies.reduce((n, t) => n + t.steps.length, 0);
  document.getElementById('audit-confirmed').textContent =
    (trophies.length - trophies.filter((t) => t.unconfirmed).length) + '/' + trophies.length;
  document.getElementById('audit-sources').textContent = doc.sources.length;
  document.getElementById('audit-missable').textContent =
    trophies.filter((t) => t.missable).length + ' missable · ' +
    trophies.filter((t) => t.unconfirmed).length + ' unconfirmed';
}

function buildCategories() {
  const cats = [...new Set(trophies.map((t) => t.category))].sort();
  for (const c of cats) {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    categoryEl.append(o);
  }
}

function stepKey(tid, i) { return tid + ':' + i; }

function openGuide(id, scroll) {
  const det = document.querySelector('[data-guide-for="' + id + '"]');
  if (!det) return;
  det.hidden = false;
  const btn = document.querySelector('[data-toggle-for="' + id + '"]');
  if (btn) btn.textContent = 'Hide cited steps';
  if (scroll) {
    const row = det.closest('tr');
    if (row) row.scrollIntoView({ block: 'center' });
  }
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const grade = gradeEl.value;
  const cat = categoryEl.value;
  const hideEarned = unearnedEl.checked;
  rowsEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (grade !== 'all' && t.grade !== grade) continue;
    if (cat !== 'all' && t.category !== cat) continue;
    if (hideEarned && earned.has(t.name)) continue;
    const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' +
      t.steps.map((s) => s.text + ' ' + s.source).join(' ')).toLowerCase();
    if (q && !hay.includes(q)) continue;
    shown++;
    const tr = document.createElement('tr');
    if (earned.has(t.name)) tr.className = 'done';
    const boxTd = document.createElement('td');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      save();
      render();
    });
    boxTd.append(box);
    const nameTd = document.createElement('td');
    const name = document.createElement('div');
    name.className = 'tname';
    name.textContent = t.id + '. ' + t.name;
    const desc = document.createElement('div');
    desc.className = 'tdesc';
    desc.textContent = t.description;
    nameTd.append(name, desc);
    const gradeTd = document.createElement('td');
    const pill = document.createElement('span');
    pill.className = 'grade-pill ' + t.grade;
    pill.textContent = t.grade;
    gradeTd.append(pill);
    if (t.missable) {
      const f = document.createElement('span');
      f.className = 'flag missable';
      f.textContent = 'MISSABLE';
      gradeTd.append(f);
    }
    if (t.unconfirmed) {
      const f = document.createElement('span');
      f.className = 'flag unconfirmed';
      f.textContent = 'UNCONFIRMED';
      gradeTd.append(f);
    }
    const timeTd = document.createElement('td');
    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = t.time;
    const diff = document.createElement('span');
    diff.className = 'diff';
    diff.textContent = dots(t.difficulty);
    diff.title = 'Difficulty ' + t.difficulty + ' of 5 (community estimate)';
    const catEl = document.createElement('span');
    catEl.className = 'cat';
    catEl.textContent = t.category;
    timeTd.append(time, diff, catEl);
    const guideTd = document.createElement('td');
    const g = document.createElement('p');
    g.className = 'guide';
    g.textContent = t.guide;
    const det = document.createElement('div');
    det.className = 'guide-detail';
    det.hidden = true;
    det.dataset.guideFor = String(t.id);
    const ol = document.createElement('ol');
    ol.className = 'steps';
    t.steps.forEach((s, i) => {
      const li = document.createElement('li');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'step-check';
      cb.checked = doneSteps.has(stepKey(t.id, i));
      cb.setAttribute('aria-label', 'Step done');
      cb.addEventListener('change', () => {
        if (cb.checked) doneSteps.add(stepKey(t.id, i));
        else doneSteps.delete(stepKey(t.id, i));
        save();
        updateProgress();
      });
      const span = document.createElement('span');
      span.textContent = s.text;
      const src = document.createElement('span');
      src.className = 'src';
      src.textContent = s.source;
      li.append(cb, ' ', span, src);
      ol.append(li);
    });
    det.append(ol);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'guide-toggle';
    toggle.dataset.toggleFor = String(t.id);
    toggle.textContent = 'Show ' + t.steps.length + ' cited steps';
    toggle.addEventListener('click', () => {
      det.hidden = !det.hidden;
      toggle.textContent = det.hidden
        ? 'Show ' + t.steps.length + ' cited steps'
        : 'Hide cited steps';
    });
    guideTd.append(g, det, toggle);
    tr.append(boxTd, nameTd, gradeTd, timeTd, guideTd);
    rowsEl.append(tr);
  }
  document.getElementById('empty').hidden = shown !== 0;
  updateProgress();
  document.body.classList.toggle('spoiled', spoilerEl.checked);
}

function updateProgress() {
  const totalSteps = trophies.reduce((n, t) => n + t.steps.length, 0);
  document.getElementById('progress').textContent = earned.size + ' of ' + trophies.length + ' earned';
  document.getElementById('progress-steps').textContent = doneSteps.size + ' of ' + totalSteps + ' steps done';
}

document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...earned], steps: [...doneSteps] }, null, 2)], { type: 'application/json' }));
  a.download = 'trophy-progress.json';
  a.click();
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  earned = new Set(Array.isArray(data) ? data : (data.earned ?? []));
  doneSteps = new Set(data.steps ?? []);
  save();
  render();
});
gradeEl.addEventListener('change', render);
categoryEl.addEventListener('change', render);
searchEl.addEventListener('input', render);
spoilerEl.addEventListener('change', render);
unearnedEl.addEventListener('change', render);

buildMap();
buildGradebar();
buildCategories();
if (params.get('grade')) gradeEl.value = params.get('grade');
render();
if (params.get('guide')) openGuide(Number(params.get('guide')), true);
if (params.get('view') === 'roadmap') {
  document.getElementById('roadmap').scrollIntoView();
} else if (params.get('view') === 'atlas') {
  document.getElementById('atlas').scrollIntoView();
}
if (params.get('scroll')) window.scrollBy(0, Number(params.get('scroll')));
