// Leonida Atlas — GTA VI trophy guide app.
// Checklist + cited step guides + steppers + roadmap + atlas, all saved in localStorage.
const KEY = 'gta6-trophy-checklist-v3';
const STEP_KEY = 'gta6-trophy-steppers-v3';
const rowsEl = document.getElementById('rows');
const guideEl = document.getElementById('guide');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const spoilerEl = document.getElementById('spoiler');

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let steppers = JSON.parse(localStorage.getItem(STEP_KEY) ?? '{}');
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
  localStorage.setItem(STEP_KEY, JSON.stringify(steppers));
}

function fmt(n) {
  return n.toLocaleString('en-US');
}

function renderAudit() {
  const totalSteps = trophies.reduce((a, t) => a + t.steps.length, 0);
  const confirmed = trophies.filter((t) => !t.unconfirmed).length;
  const unconfirmed = trophies.filter((t) => t.unconfirmed);
  const allSources = new Set();
  trophies.forEach((t) => t.steps.forEach((s) => allSources.add(s.source)));
  const stepperCount = trophies.filter((t) => t.stepper).length;
  const pct = Math.round((confirmed / trophies.length) * 100);
  document.getElementById('audit-line').textContent =
    `${fmt(totalSteps)} steps cited · ${confirmed}/${trophies.length} confirmed · ${unconfirmed.length} unconfirmed`;
  document.getElementById('audit-cells').innerHTML = '';
  const cells = [
    [`${fmt(totalSteps)}`, 'steps cited'],
    [`${pct}%`, 'confirmed'],
    [`${allSources.size}`, 'sources'],
    [`${stepperCount}`, 'steppers'],
  ];
  for (const [num, label] of cells) {
    const d = document.createElement('div');
    d.className = 'audit-cell';
    const b = document.createElement('b');
    b.textContent = num;
    const s = document.createElement('span');
    s.textContent = label;
    d.append(b, s);
    document.getElementById('audit-cells').append(d);
  }
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  const parts = grades.map((g) => {
    const list = trophies.filter((t) => t.grade === g);
    const ok = list.filter((t) => !t.unconfirmed).length;
    const label = g[0].toUpperCase() + g.slice(1);
    return `${label} ${ok}/${list.length}`;
  });
  document.getElementById('audit-grades').textContent = parts.join(' · ');
  document.getElementById('audit-foot').textContent =
    `Unconfirmed: ${unconfirmed.map((t) => `#${t.id} ${t.name}`).join(' · ')} — verified ${doc.verified} · sources: ${doc.sources.join(' · ')}`;
}

function medalFor(t) {
  const m = document.createElement('span');
  m.className = `medal ${t.grade[0]}`;
  m.textContent = t.grade[0].toUpperCase();
  m.title = t.grade;
  return m;
}

function renderProgress() {
  const n = earned.size;
  const total = trophies.length;
  const pct = Math.round((n / total) * 100);
  document.getElementById('progress-text').textContent = `${n} / ${total} · ${pct}%`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  const next = trophies.find((t) => !earned.has(t.name));
  const nextEl = document.getElementById('nextup');
  if (!next) {
    nextEl.textContent = 'Next up: platinum earned — Vice Got a Price!';
  } else {
    const first = next.steps[0] ? next.steps[0].text : next.guide;
    nextEl.textContent = `Next up: #${next.id} ${next.name} — ${first}`;
  }
}

function renderRows() {
  rowsEl.replaceChildren();
  const q = searchEl.value.trim().toLowerCase();
  const g = gradeEl.value;
  const hideSpoiler = spoilerEl.checked;
  let shown = 0;
  for (const t of trophies) {
    if (g !== 'all' && t.grade !== g) continue;
    if (hideSpoiler && t.hidden) continue;
    const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.steps.map((s) => s.text).join(' ')).toLowerCase();
    if (q && !hay.includes(q)) continue;
    shown++;
    const row = document.createElement('div');
    row.className = 'trophy-row' + (earned.has(t.name) ? ' earned' : '');
    row.dataset.id = t.id;
    const head = document.createElement('div');
    head.className = 'row-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      save();
      renderProgress();
      renderRows();
    });
    head.append(box, medalFor(t));
    const main = document.createElement('div');
    main.className = 'row-main';
    const title = document.createElement('div');
    title.className = 'row-title';
    title.textContent = `#${t.id} ${t.name}`;
    const desc = document.createElement('div');
    desc.className = 'row-desc';
    desc.textContent = t.description;
    const preview = document.createElement('div');
    preview.className = 'row-preview';
    preview.textContent = t.guide;
    const src = document.createElement('div');
    src.className = 'row-sources';
    src.textContent = `Sources: ${t.sources.join(' · ')}`;
    main.append(title, desc, preview, src);
    const tags = document.createElement('div');
    tags.className = 'row-tags';
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'tag missable';
      m.textContent = 'missable';
      tags.append(m);
    }
    if (t.unconfirmed) {
      const u = document.createElement('span');
      u.className = 'tag unconfirmed';
      u.textContent = 'unconfirmed';
      tags.append(u);
    }
    if (t.stepper) {
      const s = document.createElement('span');
      s.className = 'tag stepper';
      const cur = steppers[t.id] ?? 0;
      s.textContent = `stepper ${cur} / ${fmt(t.stepper)}`;
      tags.append(s);
    }
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'open-guide';
    open.textContent = `${t.steps.length} steps ›`;
    open.addEventListener('click', () => renderGuide(t));
    row.append(head, main, tags, open);
    rowsEl.append(row);
  }
  document.getElementById('count').textContent = `${shown} of ${trophies.length} trophies shown · ${trophies.reduce((a, t) => a + t.steps.length, 0)} cited steps in total`;
}

function renderGuide(t) {
  guideEl.hidden = false;
  guideEl.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = `#${t.id} ${t.name}`;
  const meta = document.createElement('p');
  meta.className = 'guide-meta';
  meta.textContent = `${t.grade} · ${t.description} · Sources: ${t.sources.join(' · ')}`;
  guideEl.append(h, meta);
  if (t.missable) {
    const w = document.createElement('p');
    w.className = 'warn';
    w.textContent = '⚠ Possibly missable — do this before the final mission.';
    guideEl.append(w);
  }
  if (t.unconfirmed) {
    const w = document.createElement('p');
    w.className = 'warn';
    w.textContent = '⚠ Unconfirmed — no guide site has verified this yet.';
    guideEl.append(w);
  }
  if (t.stepper) {
    const wrap = document.createElement('div');
    wrap.className = 'stepper';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Decrease progress');
    const val = document.createElement('span');
    const cur = steppers[t.id] ?? 0;
    val.textContent = `${fmt(cur)} / ${fmt(t.stepper)} spots`;
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Increase progress');
    const bump = (d) => {
      const next = Math.max(0, Math.min(t.stepper, (steppers[t.id] ?? 0) + d));
      steppers[t.id] = next;
      if (next >= t.stepper) earned.add(t.name);
      save();
      renderProgress();
      renderGuide(t);
      renderRows();
    };
    minus.addEventListener('click', () => bump(-1));
    plus.addEventListener('click', () => bump(1));
    wrap.append(minus, val, plus);
    guideEl.append(wrap);
  }
  const ol = document.createElement('ol');
  ol.className = 'steps';
  t.steps.forEach((s, i) => {
    const li = document.createElement('li');
    const tx = document.createElement('span');
    tx.textContent = s.text;
    const cite = document.createElement('span');
    cite.className = 'cite';
    cite.textContent = `[${s.source}]`;
    li.append(tx, ' ', cite);
    ol.append(li);
  });
  guideEl.append(ol);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'close-guide';
  close.textContent = 'Close guide';
  close.addEventListener('click', () => {
    guideEl.hidden = true;
    guideEl.replaceChildren();
  });
  guideEl.append(close);
  guideEl.scrollIntoView({ behavior: 'instant', block: 'start' });
}

function applyParams() {
  const p = new URLSearchParams(location.search);
  const view = p.get('view');
  if (view && ['checklist', 'roadmap', 'atlas'].includes(view)) setView(view);
  const grade = p.get('grade');
  if (grade && ['all', 'platinum', 'gold', 'silver', 'bronze'].includes(grade)) gradeEl.value = grade;
  const q = p.get('search');
  if (q) searchEl.value = q;
  if (p.get('spoiler') === '1') spoilerEl.checked = true;
}

function setView(name) {
  for (const b of document.querySelectorAll('.views button')) {
    b.classList.toggle('active', b.dataset.view === name);
  }
  for (const v of document.querySelectorAll('.view')) {
    v.hidden = v.id !== `view-${name}`;
  }
}

document.querySelectorAll('.views button').forEach((b) => {
  b.addEventListener('click', () => setView(b.dataset.view));
});
searchEl.addEventListener('input', renderRows);
gradeEl.addEventListener('change', renderRows);
spoilerEl.addEventListener('change', renderRows);

document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...earned], steppers })], { type: 'application/json' }));
  a.download = 'trophy-progress.json';
  a.click();
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  earned = new Set(data.earned ?? data);
  steppers = data.steppers ?? {};
  save();
  renderProgress();
  renderRows();
});
document.getElementById('share').addEventListener('click', async () => {
  const p = new URLSearchParams();
  const view = document.querySelector('.views button.active').dataset.view;
  if (view !== 'checklist') p.set('view', view);
  if (gradeEl.value !== 'all') p.set('grade', gradeEl.value);
  if (searchEl.value.trim()) p.set('search', searchEl.value.trim());
  if (spoilerEl.checked) p.set('spoiler', '1');
  const url = `${location.origin}${location.pathname}${p.toString() ? '?' + p.toString() : ''}`;
  try {
    await navigator.clipboard.writeText(url);
    document.getElementById('share').textContent = 'Link copied!';
    setTimeout(() => { document.getElementById('share').textContent = 'Copy share link'; }, 2000);
  } catch {
    prompt('Copy this link:', url);
  }
});

applyParams();
renderAudit();
renderProgress();
renderRows();
// Open a guide panel from ?guide=<id> AFTER the rows exist, so the scroll lands on it.
{
  const guideId = Number(new URLSearchParams(location.search).get('guide'));
  if (Number.isInteger(guideId) && guideId > 0) {
    const t = trophies.find((x) => x.id === guideId);
    if (t) renderGuide(t);
  }
}
