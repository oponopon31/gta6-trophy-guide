// Leonida Atlas — GTA VI trophy guide & tracker.
// Offline, static, no network: loads app/data/trophies.json, saves progress in localStorage.
const KEY = 'leonida-atlas-progress-v1';
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? '0');
const paramView = params.get('view');
const paramId = Number(params.get('id') ?? '0');
const paramSpoiler = params.get('spoiler') === '1';

let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { saved = {}; }
let earned = new Set(saved.earned ?? []);
let counts = saved.counts ?? {};
let spoiler = paramSpoiler || saved.spoiler === true;
if (seed > 0 && earned.size === 0) {
  for (const t of trophies.slice(0, seed)) earned.add(t.id);
  save();
}

const $ = (id) => document.getElementById(id);
const rowsEl = $('rows');
const guidePane = $('guidePane');
const missableRows = $('missableRows');

function save() {
  localStorage.setItem(KEY, JSON.stringify({ earned: [...earned], counts, spoiler }));
}

function gradeLabel(g) {
  return g === 'platinum' ? 'Platinum' : g === 'gold' ? 'Gold' : g === 'silver' ? 'Silver' : 'Bronze';
}

function citedSteps(t) { return t.steps ? t.steps.length : 0; }

function isHidden(t) { return spoiler && t.hidden && !earned.has(t.id); }

function renderAudit() {
  const total = trophies.length;
  const cited = trophies.reduce((n, t) => n + citedSteps(t), 0);
  const unconfirmed = trophies.filter((t) => !t.confirmed).length;
  const missable = trophies.filter((t) => t.missable).length;
  const verified = total;
  $('auditSegments').innerHTML =
    '<span class="seg seg-verified" style="flex:' + verified + '"></span>' +
    '<span class="seg seg-cited" style="flex:' + cited + '"></span>' +
    '<span class="seg seg-unconfirmed" style="flex:' + Math.max(unconfirmed, 1) + '"></span>' +
    '<span class="seg seg-missable" style="flex:' + Math.max(missable, 1) + '"></span>';
  $('auditNumbers').innerHTML =
    '<span><strong>' + verified + '/' + total + '</strong> trophies verified</span>' +
    '<span><strong>' + cited + '</strong> steps cited</span>' +
    '<span><strong>' + unconfirmed + '</strong> unconfirmed</span>' +
    '<span><strong>' + missable + '</strong> missable</span>';
}

function renderProgress() {
  const n = earned.size;
  const total = trophies.length;
  const pct = Math.round((n / total) * 100);
  $('platinumCount').textContent = n + ' / ' + total;
  $('stickyCount').textContent = n + ' / ' + total + ' · ' + pct + '%';
  const next = trophies.find((t) => !earned.has(t.id));
  $('stickyNext').textContent = next
    ? 'Next up: ' + (isHidden(next) ? 'Hidden story trophy' : next.name) + ' — ' + (isHidden(next) ? 'earn it to reveal it' : next.steps[0].text)
    : 'All 55 earned — the platinum is yours.';
}

function stepperHtml(t) {
  if (!t.target) return '';
  const v = counts[t.id] ?? 0;
  return '<span class="stepper" data-id="' + t.id + '">' +
    '<button type="button" data-step="-1" aria-label="Decrease">−</button>' +
    '<span class="stepper-value">' + v + ' / ' + t.target.toLocaleString('en-US') + '</span>' +
    '<button type="button" data-step="1" aria-label="Increase">+</button></span>';
}

function rowHtml(t) {
  const hidden = isHidden(t);
  const name = hidden ? 'Hidden story trophy' : t.name;
  const desc = hidden ? 'Spoilers are hidden until this trophy is earned.' : t.description;
  const guide = hidden ? 'Earn this trophy to reveal its guide.' : t.guide;
  const sources = t.sources.join(' · ');
  return '<article class="trophy-row" data-id="' + t.id + '">' +
    '<label class="earn"><input type="checkbox" data-earn="' + t.id + '"' + (earned.has(t.id) ? ' checked' : '') + '> <span>Earned</span></label>' +
    '<div class="row-main">' +
    '<div class="row-head"><span class="medal medal-' + t.grade + '">' + gradeLabel(t.grade) + '</span>' +
    '<h3>' + name + '</h3>' +
    (t.missable ? '<span class="flag flag-missable">⚠ Missable</span>' : '') +
    (!t.confirmed ? '<span class="flag flag-unconfirmed">Unconfirmed</span>' : '') +
    '</div>' +
    '<p class="row-desc">' + desc + '</p>' +
    '<p class="row-guide">' + guide + '</p>' +
    '<p class="row-cites">' + citedSteps(t) + ' steps cited &middot; Sources: ' + sources + '</p>' +
    '<div class="row-actions">' + stepperHtml(t) +
    '<button type="button" class="open-guide" data-guide="' + t.id + '">Open guide</button></div>' +
    '</div></article>';
}

function filtered() {
  const q = $('search').value.trim().toLowerCase();
  const kind = $('kind').value;
  const grade = $('grade').value;
  const onlyMissable = $('onlyMissable').checked;
  const onlyUnconfirmed = $('onlyUnconfirmed').checked;
  return trophies.filter((t) => {
    if (kind !== 'all' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (onlyMissable && !t.missable) return false;
    if (onlyUnconfirmed && t.confirmed) return false;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.steps.map((s) => s.text).join(' ')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderRows() {
  const list = filtered();
  rowsEl.innerHTML = list.length
    ? list.map(rowHtml).join('')
    : '<p class="no-results">No trophies match these filters.</p>';
}

function renderMissable() {
  missableRows.innerHTML = trophies.filter((t) => t.missable).map(rowHtml).join('');
}

function openGuide(id) {
  const t = trophies.find((x) => x.id === id);
  if (!t) return;
  const hidden = isHidden(t);
  const steps = hidden
    ? '<p class="guide-hidden">Spoilers are hidden until this trophy is earned. Tick it off in the Atlas to reveal its guide.</p>'
    : '<ol class="steps">' + t.steps.map((s, i) =>
      '<li><span class="step-num">' + (i + 1) + '</span><span class="step-text">' + s.text + '</span><span class="step-source">[' + s.source + ']</span></li>'
    ).join('') + '</ol>';
  guidePane.innerHTML =
    '<div class="guide-head"><span class="medal medal-' + t.grade + '">' + gradeLabel(t.grade) + '</span>' +
    '<h2>' + (hidden ? 'Hidden story trophy' : t.name) + '</h2>' +
    (t.missable ? '<span class="flag flag-missable">⚠ Missable</span>' : '') +
    (!t.confirmed ? '<span class="flag flag-unconfirmed">Unconfirmed</span>' : '') + '</div>' +
    '<div class="guide-actions">' + stepperHtml(t) +
    '<label class="earn"><input type="checkbox" data-earn="' + t.id + '"' + (earned.has(t.id) ? ' checked' : '') + '> <span>Earned</span></label></div>' +
    '<p class="guide-desc">' + (hidden ? 'Spoilers are hidden until this trophy is earned.' : t.description) + '</p>' +
    '<p class="guide-summary">' + (hidden ? '' : t.guide) + '</p>' +
    steps +
    '<p class="guide-sources">Sources: ' + t.sources.join(' · ') + ' — ' + citedSteps(t) + ' steps cited.</p>';
  switchView('guide');
}

function switchView(name) {
  document.body.dataset.view = name;
  if (name === 'missable') renderMissable();
  for (const b of document.querySelectorAll('.view-tab')) {
    b.classList.toggle('active', b.dataset.view === name);
  }
  for (const v of document.querySelectorAll('.view')) {
    v.classList.toggle('active', v.id === 'view-' + name);
  }
}

document.addEventListener('click', (e) => {
  const tab = e.target.closest('.view-tab');
  if (tab) { switchView(tab.dataset.view); return; }
  const open = e.target.closest('[data-guide]');
  if (open) { openGuide(Number(open.dataset.guide)); return; }
  const stepBtn = e.target.closest('.stepper [data-step]');
  if (stepBtn) {
    const wrap = stepBtn.closest('.stepper');
    const id = Number(wrap.dataset.id);
    const t = trophies.find((x) => x.id === id);
    const v = Math.max(0, Math.min(t.target, (counts[id] ?? 0) + Number(stepBtn.dataset.step)));
    counts[id] = v;
    if (v >= t.target) earned.add(id);
    save();
    renderRows();
    renderProgress();
    if (document.getElementById('view-guide').classList.contains('active')) openGuide(id);
    return;
  }
});

document.addEventListener('change', (e) => {
  const earn = e.target.closest('[data-earn]');
  if (earn) {
    const id = Number(earn.dataset.earn);
    if (earn.checked) earned.add(id);
    else earned.delete(id);
    save();
    renderRows();
    renderProgress();
    if (document.getElementById('view-guide').classList.contains('active')) {
      const openId = guidePane.querySelector('[data-earn]');
      if (openId) openGuide(Number(openId.dataset.earn));
    }
    return;
  }
  if (e.target.id === 'spoiler') {
    spoiler = e.target.checked;
    save();
    renderRows();
    renderProgress();
    return;
  }
  if (e.target.id === 'import') {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const data = JSON.parse(text);
        earned = new Set((data.earned ?? []).map(Number));
        counts = data.counts ?? {};
        save();
        renderRows();
        renderProgress();
      } catch { /* ignore a bad import file */ }
    });
  }
});

for (const id of ['search', 'kind', 'grade', 'onlyMissable', 'onlyUnconfirmed']) {
  $(id).addEventListener('input', renderRows);
  $(id).addEventListener('change', renderRows);
}

$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...earned], counts })], { type: 'application/json' }));
  a.download = 'leonida-atlas-progress.json';
  a.click();
});

$('share').addEventListener('click', async () => {
  const url = location.origin + location.pathname + '?view=atlas';
  try { await navigator.clipboard.writeText(url); $('share').textContent = 'Link copied'; }
  catch { $('share').textContent = url; }
});

// Initial state from URL params (used by the screenshots too).
$('spoiler').checked = spoiler;
const paramQ = params.get('q');
if (paramQ) $('search').value = paramQ;
renderAudit();
renderRows();
renderProgress();
if (paramView && document.getElementById('view-' + paramView)) switchView(paramView);
if (paramId) openGuide(paramId);
