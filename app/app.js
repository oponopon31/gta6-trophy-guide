// Leonida Platinum — GTA 6 trophy guide and tracker.
// A static app: it fetches data/trophies.json (a file under app/), renders the
// checklist and the guide panel, and saves progress in localStorage. It makes no
// network request at run time beyond loading its own files.

const STORE_KEY = 'leonida-platinum-v1';
const TOTAL = 55;

let TROPHIES = [];
let SOURCE_URLS = {};

let state = { earned: {}, counts: {}, spoiler: false };
let selectedId = null;
let searchText = '';
let gradeFilter = '';
let kindFilter = '';

const $ = (id) => document.getElementById(id);

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.earned)) {
        // Export files store earned as a list of ids; normalize to a map.
        const map = {};
        for (const id of parsed.earned) {
          if (typeof id === 'number') map[id] = true;
        }
        state.earned = map;
      } else if (parsed.earned && typeof parsed.earned === 'object') {
        state.earned = parsed.earned;
      }
      if (parsed.counts && typeof parsed.counts === 'object') state.counts = parsed.counts;
      if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
    }
  } catch (err) {
    console.warn('Saved progress could not be read; starting fresh.', err);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Progress could not be saved.', err);
  }
}

function trophyById(id) {
  return TROPHIES.find((t) => t.id === id);
}

function isEarned(t) {
  return !!state.earned[t.id];
}

function countOf(t) {
  const n = state.counts[t.id];
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

function setCount(t, n) {
  const target = typeof t.target === 'number' ? t.target : null;
  let value = Math.max(0, Math.floor(n));
  if (target !== null) value = Math.min(target, value);
  state.counts[t.id] = value;
  if (target !== null && value >= target) state.earned[t.id] = true;
  saveState();
  refresh();
}

function toggleEarned(t, earned) {
  if (earned) state.earned[t.id] = true;
  else delete state.earned[t.id];
  saveState();
  refresh();
}

function firstSentence(text) {
  const m = String(text).match(/^[^.!?]+[.!?]/);
  return m ? m[0] : String(text);
}

function isHidden(t) {
  return state.spoiler && t.kind === 'story' && !isEarned(t);
}

function updateProgress() {
  const earned = TROPHIES.filter(isEarned).length;
  const pct = Math.round((earned / TOTAL) * 100);
  $('earned-count').textContent = earned + ' / ' + TOTAL;
  $('earned-pct').textContent = pct + '%';
  $('progress-fill').style.width = pct + '%';
  const next = TROPHIES.find((t) => !isEarned(t));
  $('next-up').textContent = next
    ? next.name + ' — ' + firstSentence(next.guide)
    : 'All 55 earned — the platinum is yours.';
}

function matchesFilters(t) {
  if (gradeFilter && t.grade !== gradeFilter) return false;
  if (kindFilter === 'missable' && !t.missable) return false;
  if (kindFilter && kindFilter !== 'missable' && t.kind !== kindFilter) return false;
  if (searchText) {
    const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
    if (!hay.includes(searchText)) return false;
  }
  return true;
}

function sourcesLine(t) {
  return 'Sources: ' + t.sources.join(' · ');
}

function renderList() {
  const list = $('trophy-list');
  list.textContent = '';
  let shown = 0;
  for (const t of TROPHIES) {
    if (!matchesFilters(t)) continue;
    shown += 1;
    const li = document.createElement('li');
    li.className = 'trophy-row' + (isEarned(t) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    li.dataset.id = String(t.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleEarned(t, box.checked);
    });
    li.appendChild(box);

    const medal = document.createElement('span');
    medal.className = 'medal ' + t.grade;
    medal.title = t.grade;
    li.appendChild(medal);

    const main = document.createElement('div');
    main.className = 'trophy-main';

    const name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = isHidden(t) ? 'Hidden story trophy' : t.name;
    main.appendChild(name);

    if (t.missable) {
      const tag = document.createElement('span');
      tag.className = 'tag missable';
      tag.textContent = 'possibly missable';
      main.appendChild(tag);
    }
    if (t.unconfirmed) {
      const tag = document.createElement('span');
      tag.className = 'tag unconfirmed';
      tag.textContent = 'unconfirmed';
      main.appendChild(tag);
    }
    if (typeof t.target === 'number') {
      const chip = document.createElement('span');
      chip.className = 'progress-chip';
      chip.textContent = 'Progress: ' + countOf(t) + ' / ' + t.target;
      main.appendChild(chip);
    }

    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = isHidden(t) ? 'Story trophy — hidden until earned.' : t.description;
    main.appendChild(desc);

    const preview = document.createElement('div');
    preview.className = 'guide-preview';
    preview.textContent = isHidden(t)
      ? 'Guide hidden until earned.'
      : firstSentence(t.guide);
    main.appendChild(preview);

    const sources = document.createElement('div');
    sources.className = 'sources-line';
    sources.textContent = sourcesLine(t);
    main.appendChild(sources);

    li.appendChild(main);
    li.addEventListener('click', () => selectTrophy(t.id));
    list.appendChild(li);
  }
  $('empty-note').hidden = shown !== 0;
}

function refresh() {
  updateProgress();
  renderList();
  renderDetail();
}

function selectTrophy(id) {
  selectedId = id;
  renderList();
  renderDetail();
  const detail = $('detail');
  if (detail && !detail.hidden) detail.scrollIntoView({ block: 'nearest' });
}

function renderDetail() {
  const panel = $('detail');
  const body = $('detail-body');
  body.textContent = '';
  if (selectedId === null) {
    panel.hidden = true;
    return;
  }
  const t = trophyById(selectedId);
  if (!t) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;

  const title = document.createElement('h2');
  title.textContent = isHidden(t) ? 'Hidden story trophy' : t.name;
  body.appendChild(title);

  const grade = document.createElement('div');
  grade.className = 'grade-line';
  grade.textContent = t.grade.charAt(0).toUpperCase() + t.grade.slice(1) + ' trophy · ' + t.kind + (typeof t.target === 'number' ? ' · PSN target: ' + t.target + ' ' + (t.unit || '') : '');
  body.appendChild(grade);

  if (isHidden(t)) {
    const note = document.createElement('p');
    note.className = 'guide-text';
    note.textContent = 'This is a story trophy. Turn the spoiler setting off, or earn it, to see its description and guide.';
    body.appendChild(note);
    return;
  }

  if (typeof t.target === 'number') {
    const stepper = document.createElement('div');
    stepper.className = 'stepper';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Decrease progress');
    minus.addEventListener('click', () => setCount(t, countOf(t) - 1));
    const value = document.createElement('span');
    value.className = 'stepper-value';
    value.textContent = countOf(t) + ' / ' + t.target + (t.unit ? ' ' + t.unit : '');
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Increase progress');
    plus.addEventListener('click', () => setCount(t, countOf(t) + 1));
    const note = document.createElement('span');
    note.className = 'stepper-note';
    note.textContent = 'Reaching ' + t.target + ' marks the trophy earned.';
    stepper.append(minus, value, plus, note);
    body.appendChild(stepper);
  }

  const desc = document.createElement('p');
  desc.className = 'guide-text';
  desc.textContent = t.description;
  body.appendChild(desc);

  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = t.guide;
  body.appendChild(guide);

  if (t.missable) {
    const note = document.createElement('div');
    note.className = 'missable-note';
    note.textContent = 'Possibly missable: the first meditation is offered in Chapter 1 and cannot be done later. Do it before leaving Chapter 1.';
    body.appendChild(note);
  }
  if (t.unconfirmed) {
    const note = document.createElement('div');
    note.className = 'unconfirmed-note';
    note.textContent = 'Unconfirmed: no guide has pinned this one down yet. The steps above are the best current reading of the official description.';
    body.appendChild(note);
  }

  const sources = document.createElement('p');
  sources.className = 'sources';
  sources.appendChild(document.createTextNode('Sources: '));
  t.sources.forEach((name, i) => {
    if (i > 0) sources.appendChild(document.createTextNode(' · '));
    const url = SOURCE_URLS[name];
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = name;
      sources.appendChild(a);
    } else {
      sources.appendChild(document.createTextNode(name));
    }
  });
  body.appendChild(sources);

  const mark = document.createElement('button');
  mark.type = 'button';
  mark.className = 'mark-earned';
  mark.textContent = isEarned(t) ? '✓ Earned — click to unmark' : 'Mark earned';
  mark.addEventListener('click', () => toggleEarned(t, !isEarned(t)));
  body.appendChild(mark);
}

function showView(view) {
  const checklist = view === 'checklist';
  $('view-checklist').hidden = !checklist;
  $('view-roadmap').hidden = checklist;
  $('tab-checklist').setAttribute('aria-current', checklist ? 'page' : 'false');
  $('tab-roadmap').setAttribute('aria-current', checklist ? 'false' : 'page');
  if (!checklist) $('detail').hidden = true;
}

function exportState() {
  return { app: 'leonida-platinum', version: 1, earned: Object.keys(state.earned).map(Number), counts: state.counts, spoiler: state.spoiler };
}

function importState(data) {
  if (!data || typeof data !== 'object') throw new Error('Not a progress file.');
  const earned = {};
  const list = Array.isArray(data.earned) ? data.earned : [];
  for (const id of list) {
    if (typeof id === 'number' && trophyById(id)) earned[id] = true;
  }
  const counts = {};
  if (data.counts && typeof data.counts === 'object') {
    for (const [key, value] of Object.entries(data.counts)) {
      const id = Number(key);
      if (trophyById(id) && typeof value === 'number' && Number.isFinite(value)) counts[id] = Math.max(0, Math.floor(value));
    }
  }
  state.earned = earned;
  state.counts = counts;
  if (typeof data.spoiler === 'boolean') state.spoiler = data.spoiler;
  saveState();
  $('spoiler-toggle').checked = state.spoiler;
  refresh();
}

function shareUrl() {
  const payload = { e: Object.keys(state.earned).map(Number), c: state.counts };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = new URL(window.location.href);
  url.searchParams.set('s', b64);
  url.hash = '';
  return url.toString();
}

function applyShareParam(param) {
  try {
    const json = decodeURIComponent(escape(atob(param.replace(/-/g, '+').replace(/_/g, '/'))));
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') return;
    const earned = {};
    for (const id of Array.isArray(data.e) ? data.e : []) {
      if (typeof id === 'number' && trophyById(id)) earned[id] = true;
    }
    const counts = {};
    if (data.c && typeof data.c === 'object') {
      for (const [key, value] of Object.entries(data.c)) {
        const id = Number(key);
        if (trophyById(id) && typeof value === 'number' && Number.isFinite(value)) counts[id] = Math.max(0, Math.floor(value));
      }
    }
    state.earned = earned;
    state.counts = counts;
    saveState();
  } catch (err) {
    console.warn('Share link could not be read.', err);
  }
}

function wireToolbar() {
  $('search').addEventListener('input', (ev) => {
    searchText = ev.target.value.trim().toLowerCase();
    renderList();
  });
  $('grade-filter').addEventListener('change', (ev) => {
    gradeFilter = ev.target.value;
    renderList();
  });
  $('kind-filter').addEventListener('change', (ev) => {
    kindFilter = ev.target.value;
    renderList();
  });
  $('spoiler-toggle').addEventListener('change', (ev) => {
    state.spoiler = ev.target.checked;
    saveState();
    renderList();
    renderDetail();
  });
  $('tab-checklist').addEventListener('click', () => showView('checklist'));
  $('tab-roadmap').addEventListener('click', () => showView('roadmap'));
  $('detail-close').addEventListener('click', () => {
    selectedId = null;
    renderList();
    renderDetail();
  });
  $('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(exportState(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-platinum-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('import-file').addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      importState(data);
      $('share-note').textContent = 'Progress imported.';
    } catch (err) {
      $('share-note').textContent = 'Import failed: that file is not valid progress.';
    }
    ev.target.value = '';
  });
  $('share-btn').addEventListener('click', async () => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      $('share-note').textContent = 'Share link copied.';
    } catch (err) {
      $('share-note').textContent = url;
    }
  });
}

async function init() {
  loadState();
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error('Could not load data/trophies.json');
  const data = await res.json();
  TROPHIES = data.trophies || [];
  SOURCE_URLS = data.sources || {};
  wireToolbar();
  $('spoiler-toggle').checked = state.spoiler;

  const params = new URLSearchParams(window.location.search);
  if (params.get('s')) applyShareParam(params.get('s'));
  if (params.get('spoiler') === '1') {
    state.spoiler = true;
    $('spoiler-toggle').checked = true;
    saveState();
  } else if (params.get('spoiler') === '0') {
    state.spoiler = false;
    $('spoiler-toggle').checked = false;
    saveState();
  }
  const hash = window.location.hash || '';
  let view = params.get('view') || (hash === '#/roadmap' ? 'roadmap' : 'checklist');
  if (view !== 'roadmap' && view !== 'checklist') view = 'checklist';
  showView(view);
  const trophyParam = params.get('trophy') || (hash.startsWith('#/trophy-') ? hash.slice(9) : '');
  const trophyId = Number(trophyParam);
  if (Number.isInteger(trophyId) && trophyById(trophyId)) selectedId = trophyId;
  refresh();
}

window.LeonidaPlatinum = {
  get trophies() { return TROPHIES; },
  get state() { return state; },
  exportState,
  importState,
  selectTrophy,
  showView,
};

init().catch((err) => {
  console.error(err);
  $('trophy-list').textContent = 'The trophy list could not be loaded.';
});
