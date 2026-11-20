// Leonida Atlas — GTA VI trophy guide & tracker.
// Checklist saved in localStorage, export/import, share link, spoiler setting,
// step-level cited guides with numeric steppers (auto-earn at target),
// roadmap + atlas views, sticky progress with "Next up".
const KEY = 'leonida-atlas-progress-v2';
const STEP_KEY = 'leonida-atlas-steppers-v2';
const COLLECTIBLE_IDS = new Set([30, 31, 35, 42, 52, 53, 54, 55]);

const rowsEl = document.getElementById('rows');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const kindEl = document.getElementById('kind');
const spoilerEl = document.getElementById('spoiler');
const progressEl = document.getElementById('progress');
const progressFill = document.getElementById('progress-fill');
const nextUpEl = document.getElementById('next-up');
const guidePanel = document.getElementById('guide-panel');
const guideBody = document.getElementById('guide-body');

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let steppers = JSON.parse(localStorage.getItem(STEP_KEY) ?? '{}');
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
  localStorage.setItem(STEP_KEY, JSON.stringify(steppers));
}

function kindOf(t) {
  if (t.hidden) return 'story';
  if (COLLECTIBLE_IDS.has(t.id)) return 'collectible';
  return 'activity';
}

function gradeLabel(g) {
  return g[0].toUpperCase() + g.slice(1);
}

function visible(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${t.steps.map((s) => s.t).join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (kindEl.value !== 'all' && kindOf(t) !== kindEl.value) return false;
  if (spoilerEl.checked && t.hidden && !earned.has(t.name)) return false;
  return true;
}

function stepCount(t) {
  return steppers[t.id] ?? 0;
}

function renderAudit() {
  const totalSteps = trophies.reduce((n, t) => n + t.steps.length, 0);
  const confirmed = trophies.filter((t) => !t.unconfirmed).length;
  const pct = Math.round((confirmed / trophies.length) * 100);
  document.getElementById('audit-steps').textContent = String(totalSteps);
  document.getElementById('audit-confirmed').textContent = `${pct}%`;
  document.getElementById('audit-summary').textContent =
    `${totalSteps} steps cited · ${confirmed} / ${trophies.length} confirmed · ${trophies.length - confirmed} unconfirmed`;
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { cited: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (!t.unconfirmed) byGrade[t.grade].cited += 1;
  }
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map(
    (g) => `${gradeLabel(g)} ${byGrade[g].cited}/${byGrade[g].total} cited`,
  );
  document.getElementById('audit-grades').textContent =
    `${parts.join(' · ')} (2 unconfirmed: #44 In The Beginning… · #49 Bad Luck, I Guess)`;
}

function renderProgress() {
  const n = earned.size;
  const pct = Math.round((n / trophies.length) * 100);
  progressEl.textContent = `${n} / ${trophies.length} · ${pct}%`;
  progressFill.style.width = `${pct}%`;
  const next = trophies.find((t) => !earned.has(t.name));
  nextUpEl.textContent = next
    ? `Next up: ${next.name} — ${next.steps[0] ? next.steps[0].t : next.guide}`
    : 'Next up: the platinum is yours.';
}

function stepperChip(t) {
  if (!t.stepper) return '';
  const cur = stepCount(t);
  const done = cur >= t.stepper.target;
  return `<span class="step-chip${done ? ' done' : ''}">Progress: ${cur} / ${t.stepper.target} ${t.stepper.unit}</span>`;
}

function render() {
  rowsEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!visible(t)) continue;
    shown += 1;
    const row = document.createElement('article');
    row.className = `trophy-row grade-${t.grade}${earned.has(t.name) ? ' earned' : ''}`;
    row.dataset.id = String(t.id);
    const hiddenNow = spoilerEl.checked && t.hidden && !earned.has(t.name);
    const name = hiddenNow ? 'Hidden story trophy' : t.name;
    const desc = hiddenNow ? 'Earn it to reveal the name.' : t.description;
    const tags = [
      t.missable ? '<span class="tag missable">⚠ possibly missable</span>' : '',
      t.unconfirmed ? '<span class="tag unconfirmed">unconfirmed</span>' : '',
      t.hidden ? '<span class="tag story">story</span>' : '',
    ].join(' ');
    row.innerHTML = `
      <label class="tick"><input type="checkbox" ${earned.has(t.name) ? 'checked' : ''} aria-label="Earned: ${name}"><span class="box">✓</span></label>
      <span class="medal ${t.grade}" aria-label="${t.grade}">${t.grade[0].toUpperCase()}</span>
      <div class="row-main">
        <div class="row-head"><span class="trophy-name">${name}</span> <span class="trophy-grade">${gradeLabel(t.grade)}</span> ${tags}</div>
        <div class="trophy-desc">${desc}</div>
        <div class="trophy-guide">${hiddenNow ? 'Guide hidden until earned.' : t.guide}</div>
        <div class="trophy-sources">Sources: ${t.sources.join(' · ')} · ${t.steps.length} cited steps</div>
        ${stepperChip(t)}
      </div>
      <button type="button" class="open-guide">Guide →</button>`;
    row.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) earned.add(t.name);
      else earned.delete(t.name);
      save();
      render();
      renderProgress();
    });
    row.querySelector('.open-guide').addEventListener('click', () => openGuide(t));
    row.querySelector('.row-main').addEventListener('click', () => openGuide(t));
    rowsEl.append(row);
  }
  if (shown === 0) {
    rowsEl.innerHTML = '<p class="empty">No trophies match — clear the search or filters.</p>';
  }
  renderProgress();
}

function openGuide(t) {
  const cur = stepCount(t);
  const stepsHtml = t.steps
    .map((s, i) => `<li><span class="step-num">${i + 1}</span><span class="step-text">${s.t}</span><span class="step-src">[${s.s}]</span></li>`)
    .join('');
  const stepperHtml = t.stepper
    ? `<div class="stepper">
        <span class="stepper-label">Your progress</span>
        <button type="button" class="step-btn" id="step-minus" aria-label="Decrease">−</button>
        <span class="step-count" id="step-count">${cur} / ${t.stepper.target} ${t.stepper.unit}</span>
        <button type="button" class="step-btn" id="step-plus" aria-label="Increase">+</button>
        ${cur >= t.stepper.target ? '<span class="step-done">✓ target reached — trophy auto-earned</span>' : ''}
      </div>`
    : '';
  guideBody.innerHTML = `
    <h2>${t.name} <span class="trophy-grade">${gradeLabel(t.grade)}</span></h2>
    <p class="guide-desc">${t.description}</p>
    <p class="guide-summary">${t.guide}</p>
    ${t.missable ? '<p class="guide-warn">⚠ Possibly missable — do this before the story ends.</p>' : ''}
    ${t.unconfirmed ? '<p class="guide-warn">Unconfirmed — no verified method yet; the community is still testing.</p>' : ''}
    <ol class="guide-steps">${stepsHtml}</ol>
    ${stepperHtml}
    <p class="guide-sources">Sources: ${t.sources.join(' · ')}</p>
    <button type="button" class="earn-btn" id="earn-btn">${earned.has(t.name) ? '✓ Earned — tap to unmark' : 'Mark as earned'}</button>`;
  guidePanel.hidden = false;
  guidePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  const plus = document.getElementById('step-plus');
  const minus = document.getElementById('step-minus');
  if (plus) {
    plus.addEventListener('click', () => {
      steppers[t.id] = Math.min((steppers[t.id] ?? 0) + 1, t.stepper.target);
      if (steppers[t.id] >= t.stepper.target) earned.add(t.name);
      save();
      openGuide(t);
      render();
    });
  }
  if (minus) {
    minus.addEventListener('click', () => {
      steppers[t.id] = Math.max((steppers[t.id] ?? 0) - 1, 0);
      if (steppers[t.id] < t.stepper.target) earned.delete(t.name);
      save();
      openGuide(t);
      render();
    });
  }
  document.getElementById('earn-btn').addEventListener('click', () => {
    if (earned.has(t.name)) earned.delete(t.name);
    else earned.add(t.name);
    save();
    openGuide(t);
    render();
  });
}

document.getElementById('guide-close').addEventListener('click', () => {
  guidePanel.hidden = true;
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.view').forEach((v) => { v.hidden = true; });
    document.getElementById(`view-${tab.dataset.view}`).hidden = false;
  });
});

function showView(name) {
  const tab = document.querySelector(`.tab[data-view="${name}"]`);
  if (tab) tab.click();
}

document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...earned], steppers })], { type: 'application/json' }));
  a.download = 'leonida-atlas-progress.json';
  a.click();
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  earned = new Set(data.earned ?? []);
  steppers = data.steppers ?? {};
  save();
  render();
});
document.getElementById('share').addEventListener('click', async () => {
  const url = new URL(location.href);
  url.searchParams.set('earned', [...earned].length);
  try {
    await navigator.clipboard.writeText(url.toString());
    document.getElementById('share').textContent = 'Link copied ✓';
    setTimeout(() => { document.getElementById('share').textContent = 'Share'; }, 2000);
  } catch {
    prompt('Copy your progress link:', url.toString());
  }
});
searchEl.addEventListener('input', render);
gradeEl.addEventListener('change', render);
kindEl.addEventListener('change', render);
spoilerEl.addEventListener('change', render);

renderAudit();
render();

// Deep links: ?view=roadmap|atlas|checklist, ?trophy=<id>, ?spoiler=1
const params = new URLSearchParams(location.search);
if (params.get('spoiler') === '1') {
  spoilerEl.checked = true;
  render();
}
const view = params.get('view');
if (view === 'roadmap' || view === 'atlas') showView(view);
const trophyId = Number(params.get('trophy'));
if (trophyId) {
  const t = trophies.find((x) => x.id === trophyId);
  if (t) openGuide(t);
}
