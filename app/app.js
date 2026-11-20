// Leonida Platinum — offline GTA VI trophy tracker.
// Plain ES module, no libraries, no network calls: the only fetch is the
// app's own data/trophies.json, and progress lives in localStorage.

const STORE_KEY = 'leonida-platinum-v1';
const DATA_URL = 'data/trophies.json';

const listEl = document.getElementById('trophyList');
const countEl = document.getElementById('listCount');
const headingEl = document.getElementById('listHeading');
const emptyEl = document.getElementById('emptyMsg');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kindFilter');
const gradeEl = document.getElementById('gradeFilter');
const statusEl = document.getElementById('statusFilter');
const spoilerEl = document.getElementById('spoilerToggle');
const progressText = document.getElementById('progressText');
const progressPct = document.getElementById('progressPct');
const progressFill = document.getElementById('progressFill');
const progressSub = document.getElementById('progressSub');
const stickyText = document.getElementById('stickyText');
const stickyPct = document.getElementById('stickyPct');
const stickyFill = document.getElementById('stickyFill');
const actionMsg = document.getElementById('actionMsg');
const detailEl = document.getElementById('detail');

let trophies = [];
let sourceBook = {};
let earned = new Set();
let counts = {};
let spoilerOn = false;
let openId = null;
let viewTarget = null;

function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.earned)) {
      earned = new Set(parsed.earned.filter((n) => Number.isInteger(n)));
    }
    if (parsed.counts && typeof parsed.counts === 'object') {
      for (const [key, value] of Object.entries(parsed.counts)) {
        const id = Number.parseInt(key, 10);
        if (Number.isInteger(id) && Number.isInteger(value) && value > 0) {
          counts[id] = value;
        }
      }
    }
    if (typeof parsed.spoiler === 'boolean') spoilerOn = parsed.spoiler;
  } catch (_err) {
    earned = new Set();
    counts = {};
  }
}

function saveStored() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      game: 'Grand Theft Auto VI',
      earned: [...earned].sort((a, b) => a - b),
      counts,
      spoiler: spoilerOn,
    }));
  } catch (_err) {
    // Private browsing can refuse storage; the tracker still works in memory.
  }
}

function byId(id) {
  return trophies.find((t) => t.id === id) || null;
}

function isSpoilerHidden(t) {
  return spoilerOn && t.kind === 'story' && !earned.has(t.id);
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function formatCount(t, n) {
  if (t.id === 52 || t.id === 53) return '$' + n.toLocaleString('en-US');
  if (t.id === 14) return n + '%';
  return String(n);
}

function targetText(t) {
  if (t.target === null || t.target === undefined) return '';
  if (t.id === 52 || t.id === 53) return 'Target: $' + t.target.toLocaleString('en-US');
  if (t.id === 14) return 'Target: 100% completion';
  return 'Target: ' + t.target;
}

function stepSize(t) {
  if (t.id === 52 || t.id === 53) return 1000;
  return 1;
}

function previewText(t) {
  const guide = t.guide || '';
  const end = guide.indexOf('. ');
  let first = end === -1 ? guide : guide.slice(0, end + 1);
  if (first.length > 150) first = first.slice(0, 147).trimEnd() + '…';
  return first;
}

function sourceNames(t) {
  return (t.sources || [])
    .map((key) => (sourceBook[key] && sourceBook[key].short) || key)
    .join(' · ');
}

function filtered() {
  const q = searchEl.value.trim().toLowerCase();
  const kind = kindEl.value;
  const grade = gradeEl.value;
  const status = statusEl.value;
  return trophies.filter((t) => {
    if (kind !== 'all') {
      if (kind === 'missable') {
        if (!t.missable) return false;
      } else if (t.kind !== kind) {
        return false;
      }
    }
    if (grade !== 'all' && t.grade !== grade) return false;
    if (status === 'earned' && !earned.has(t.id)) return false;
    if (status === 'remaining' && earned.has(t.id)) return false;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderProgress() {
  const done = earned.size;
  const total = trophies.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressText.textContent = done + ' / ' + total + ' trophies earned';
  progressPct.textContent = pct + '%';
  progressFill.style.width = pct + '%';
  stickyText.textContent = done + ' / ' + total + ' trophies earned';
  stickyPct.textContent = pct + '%';
  stickyFill.style.width = pct + '%';
  if (done === total) {
    progressSub.textContent = 'Platinum earned: Vice Got a Price! — congratulations, Leonida Legend.';
    return;
  }
  const next = trophies.find((t) => !earned.has(t.id));
  progressSub.textContent = 'Platinum: Vice Got a Price! — ' + (total - done) + ' to go. ' +
    'Next up: ' + next.name + ' — ' + previewText(next);
}

function renderList() {
  const rows = filtered();
  listEl.innerHTML = '';
  for (const t of rows) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (earned.has(t.id) ? ' is-earned' : '') +
      (t.missable ? ' is-missable' : '') + (t.status === 'unconfirmed' ? ' is-unconfirmed' : '');
    li.dataset.id = String(t.id);

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = earned.has(t.id);
    check.setAttribute('aria-label', 'Earned: ' + t.name);
    check.addEventListener('change', () => {
      if (check.checked) earned.add(t.id); else earned.delete(t.id);
      saveStored();
      renderAll();
    });

    const body = document.createElement('button');
    body.type = 'button';
    body.className = 'trophy-body';
    body.addEventListener('click', () => openDetail(t.id));

    const hidden = isSpoilerHidden(t);
    const name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = hidden ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('span');
    desc.className = 'trophy-desc';
    desc.textContent = hidden
      ? 'Story spoiler hidden — earn this trophy to reveal its name and description.'
      : t.description;
    body.append(name, desc);
    if (!hidden) {
      const preview = document.createElement('span');
      preview.className = 'trophy-guide-preview';
      preview.textContent = previewText(t);
      body.appendChild(preview);
      const srcs = document.createElement('span');
      srcs.className = 'trophy-sources';
      srcs.textContent = 'Sources: ' + sourceNames(t);
      body.appendChild(srcs);
    }
    const meta = document.createElement('span');
    meta.className = 'trophy-meta';
    const grade = document.createElement('span');
    grade.className = 'grade grade-' + t.grade;
    grade.textContent = gradeLabel(t);
    meta.appendChild(grade);
    const kind = document.createElement('span');
    kind.className = 'kind';
    kind.textContent = t.kind;
    meta.appendChild(kind);
    if (t.missable) {
      const flag = document.createElement('span');
      flag.className = 'flag flag-missable';
      flag.textContent = 'POSSIBLY MISSABLE';
      meta.appendChild(flag);
    }
    if (t.status === 'unconfirmed') {
      const flag = document.createElement('span');
      flag.className = 'flag flag-unconfirmed';
      flag.textContent = 'UNCONFIRMED';
      meta.appendChild(flag);
    }
    const target = targetText(t);
    if (target) {
      const tg = document.createElement('span');
      tg.className = 'target';
      tg.textContent = target;
      meta.appendChild(tg);
    }
    if (t.target !== null && t.target !== undefined && (counts[t.id] || 0) > 0) {
      const prog = document.createElement('span');
      prog.className = 'count';
      prog.textContent = 'Progress: ' + formatCount(t, counts[t.id]) + ' / ' + formatCount(t, t.target);
      meta.appendChild(prog);
    }
    body.appendChild(meta);
    li.append(check, body);
    listEl.appendChild(li);
  }
  const shown = rows.length;
  countEl.textContent = shown + ' of ' + trophies.length + ' trophies shown' +
    (earned.size ? ' · ' + earned.size + ' earned' : '');
  headingEl.textContent = 'Checklist — ' + trophies.length + ' trophies';
  emptyEl.hidden = shown !== 0;
  if (openId !== null) renderDetail();
}

function sourceLink(key) {
  const src = sourceBook[key];
  if (!src) return null;
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = src.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = src.name;
  li.appendChild(a);
  const url = document.createElement('span');
  url.className = 'url';
  url.textContent = src.url;
  li.appendChild(url);
  return li;
}

function renderDetail() {
  const t = byId(openId);
  if (!t) {
    detailEl.hidden = true;
    return;
  }
  const hidden = isSpoilerHidden(t);
  document.getElementById('detailName').textContent = hidden ? 'Hidden story trophy' : t.name;
  document.getElementById('detailMeta').textContent =
    gradeLabel(t) + ' · ' + t.kind + (t.missable ? ' · possibly missable' : '') +
    (t.status === 'unconfirmed' ? ' · method unconfirmed' : '') +
    (targetText(t) ? ' · ' + targetText(t) : '');
  document.getElementById('detailDesc').textContent = hidden
    ? 'Spoiler hidden until earned.'
    : t.description;
  const badges = document.getElementById('detailBadges');
  badges.innerHTML = '';
  if (t.missable) {
    const b = document.createElement('span');
    b.className = 'flag flag-missable';
    b.textContent = 'POSSIBLY MISSABLE — see the roadmap box for the exact Chapter 1 steps and the manual-save safety net.';
    badges.appendChild(b);
  }
  if (t.status === 'unconfirmed') {
    const b = document.createElement('span');
    b.className = 'flag flag-unconfirmed';
    b.textContent = 'UNCONFIRMED — no guide has verified the method yet. Do not treat the steps below as fact.';
    badges.appendChild(b);
  }
  document.getElementById('detailGuide').textContent = hidden
    ? 'The guide for this story trophy is hidden until you earn it.'
    : t.guide;
  const progBox = document.getElementById('detailProgress');
  if (t.target !== null && t.target !== undefined && !hidden) {
    progBox.hidden = false;
    const stepValue = document.getElementById('stepValue');
    const paint = () => {
      stepValue.textContent = formatCount(t, counts[t.id] || 0) + ' / ' + formatCount(t, t.target);
    };
    paint();
    document.getElementById('stepDown').onclick = () => {
      const next = Math.max(0, (counts[t.id] || 0) - stepSize(t));
      if (next === 0) delete counts[t.id]; else counts[t.id] = next;
      if (next < t.target) earned.delete(t.id);
      saveStored();
      renderAll();
    };
    document.getElementById('stepUp').onclick = () => {
      const next = Math.min(t.target, (counts[t.id] || 0) + stepSize(t));
      counts[t.id] = next;
      if (next >= t.target) earned.add(t.id);
      saveStored();
      renderAll();
    };
  } else {
    progBox.hidden = true;
  }
  const srcList = document.getElementById('detailSources');
  srcList.innerHTML = '';
  for (const key of t.sources) {
    const li = sourceLink(key);
    if (li) srcList.appendChild(li);
  }
  const earnedBox = document.getElementById('detailEarned');
  earnedBox.checked = earned.has(t.id);
  earnedBox.onchange = () => {
    if (earnedBox.checked) earned.add(t.id); else earned.delete(t.id);
    saveStored();
    renderAll();
  };
  detailEl.hidden = false;
}

function openDetail(id) {
  openId = id;
  renderDetail();
  detailEl.scrollIntoView({ behavior: 'auto', block: 'start' });
  syncUrl();
}

function closeDetail() {
  openId = null;
  detailEl.hidden = true;
  syncUrl();
}

function syncUrl() {
  const params = new URLSearchParams();
  if (earned.size) params.set('seed', [...earned].sort((a, b) => a - b).join(','));
  if (openId !== null) params.set('open', String(openId));
  if (spoilerOn) params.set('spoiler', 'on');
  const next = params.toString();
  const url = next ? location.pathname + '?' + next : location.pathname;
  history.replaceState(null, '', url);
}

function renderAll() {
  renderProgress();
  renderList();
}

function note(msg) {
  actionMsg.textContent = msg;
  window.clearTimeout(note.timer);
  note.timer = window.setTimeout(() => { actionMsg.textContent = ''; }, 6000);
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
    counts,
    spoiler: spoilerOn,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  note('Progress exported: ' + payload.earned.length + ' trophies.');
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      const valid = new Set(trophies.map((t) => t.id));
      const kept = ids.filter((n) => Number.isInteger(n) && valid.has(n));
      earned = new Set(kept);
      if (parsed.counts && typeof parsed.counts === 'object') {
        counts = {};
        for (const [key, value] of Object.entries(parsed.counts)) {
          const id = Number.parseInt(key, 10);
          if (Number.isInteger(id) && valid.has(id) && Number.isInteger(value) && value > 0) {
            counts[id] = value;
          }
        }
      }
      if (typeof parsed.spoiler === 'boolean') {
        spoilerOn = parsed.spoiler;
        spoilerEl.checked = spoilerOn;
      }
      saveStored();
      renderAll();
      note('Progress imported: ' + kept.length + ' trophies.');
    } catch (_err) {
      note('That file is not a valid progress export.');
    }
  };
  reader.readAsText(file);
}

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  const seed = params.get('seed');
  if (seed) {
    const valid = new Set(trophies.map((t) => t.id));
    for (const part of seed.split(',')) {
      const n = Number.parseInt(part.trim(), 10);
      if (Number.isInteger(n) && valid.has(n)) earned.add(n);
    }
    saveStored();
  }
  if (params.get('spoiler') === 'on') {
    spoilerOn = true;
    spoilerEl.checked = true;
  }
  const open = params.get('open');
  if (open) {
    const n = Number.parseInt(open, 10);
    if (Number.isInteger(n) && byId(n)) openId = n;
  }
  const view = params.get('view');
  if (view === 'list') viewTarget = document.querySelector('.controls');
  else if (view === 'missable') viewTarget = document.querySelector('.missable-box');
  else if (view === 'roadmap') viewTarget = document.getElementById('roadmap');
}

async function init() {
  loadStored();
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Could not load ' + DATA_URL);
  const data = await res.json();
  trophies = data.trophies;
  sourceBook = data.sources || {};
  spoilerEl.checked = spoilerOn;
  applyUrlParams();
  renderAll();
  if (openId !== null) {
    renderDetail();
    detailEl.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  if (viewTarget) {
    viewTarget.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  searchEl.addEventListener('input', renderList);
  kindEl.addEventListener('change', renderList);
  gradeEl.addEventListener('change', renderList);
  statusEl.addEventListener('change', renderList);
  spoilerEl.addEventListener('change', () => {
    spoilerOn = spoilerEl.checked;
    saveStored();
    renderAll();
    syncUrl();
  });
  document.getElementById('detailClose').addEventListener('click', closeDetail);
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (window.confirm('Reset all progress? This clears every earned trophy.')) {
      earned = new Set();
      counts = {};
      openId = null;
      detailEl.hidden = true;
      saveStored();
      renderAll();
      syncUrl();
      note('Progress reset.');
    }
  });
  document.getElementById('shareBtn').addEventListener('click', async () => {
    syncUrl();
    try {
      await navigator.clipboard.writeText(location.href);
      note('Share link copied to clipboard.');
    } catch (_err) {
      note('Copy this URL from the address bar: ' + location.href);
    }
  });
  const importFile = document.getElementById('importFile');
  document.getElementById('importBtn').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', () => {
    if (importFile.files && importFile.files[0]) importProgress(importFile.files[0]);
    importFile.value = '';
  });
}

init().catch((err) => {
  listEl.innerHTML = '';
  emptyEl.hidden = false;
  emptyEl.textContent = 'The trophy list could not be loaded (' + err.message + '). Open this app from its own folder so data/trophies.json loads.';
});
