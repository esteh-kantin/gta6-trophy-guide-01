import { readProgress, saveProgress, applyImport } from './modules/state.js';
import { createDrawer } from './modules/drawer.js';
import { initializeTabs, renderDashboard, renderTrophies, renderRoadmap, renderMissables, renderBibliography } from './modules/render.js';

const response = await fetch('data/trophies.json');
if (!response.ok) throw new Error('Could not load the local trophy list.');
const data = await response.json();
const trophies = data.trophies;
const state = readProgress();
const filters = { search: '', grade: 'all', status: 'all', kind: 'all' };
let view = 'checklist';

function showView(name) {
  view = name;
  document.querySelectorAll('.nav-link').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  document.querySelectorAll('.view-pane').forEach((pane) => pane.classList.toggle('active', pane.id === `${name}View`));
  document.querySelector('#app').dataset.view = name;
}

function renderAll() {
  saveProgress(state);
  renderDashboard(trophies, state.earned);
  renderTrophies(trophies, state, filters, drawer.open);
  renderMissables(trophies, state, drawer.open);
  renderRoadmap(trophies, state, drawer.open);
}

const drawer = createDrawer(trophies, state, renderAll);
drawer.open.saveAndRender = renderAll;
initializeTabs((kind) => { filters.kind = kind; renderAll(); });
document.querySelectorAll('.nav-link').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
document.querySelector('#search').addEventListener('input', (event) => { filters.search = event.target.value; renderAll(); });
document.querySelector('#gradeFilter').addEventListener('change', (event) => { filters.grade = event.target.value; renderAll(); });
document.querySelector('#statusFilter').addEventListener('change', (event) => { filters.status = event.target.value; renderAll(); });
document.querySelector('#spoilerToggle').checked = state.hideSpoilers;
document.querySelector('#spoilerToggle').addEventListener('change', (event) => { state.hideSpoilers = event.target.checked; renderAll(); });

document.querySelector('#exportButton').addEventListener('click', () => {
  const backup = { version: 1, game: data.game, exportedAt: new Date().toISOString(), earned: [...state.earned] };
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  link.download = 'leonida-ledger-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
  document.querySelector('#backupMessage').textContent = 'Backup prepared on this device.';
});
document.querySelector('#importInput').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    state.earned = applyImport(await file.text(), trophies);
    document.querySelector('#backupMessage').textContent = `${state.earned.size} earned trophies restored.`;
    renderAll();
  } catch (error) {
    document.querySelector('#backupMessage').textContent = error.message || 'Could not read this backup.';
  }
  event.target.value = '';
});

renderBibliography(trophies, data.referenceLibrary);
renderAll();
const shot = new URLSearchParams(location.search).get('shot');
if (shot === '1' || shot === 'checklist') {
  document.body.classList.add('shot-checklist');
  showView('checklist');
  drawer.open(trophies.find((trophy) => trophy.id === 15) || trophies[0]);
} else if (shot === '2' || shot === 'spoilers') {
  state.hideSpoilers = true;
  document.querySelector('#spoilerToggle').checked = true;
  filters.kind = 'all';
  showView('missables');
  document.body.classList.add('shot-spoilers');
  document.querySelector('#missablesView').insertAdjacentHTML('afterbegin', '<div class="spoiler-proof"><span class="redacted-chip">STORY SPOILER MASK</span><strong>CLASSIFIED STORY DETAIL</strong><small>Hidden name + description stay concealed until earned.</small></div>');
  renderAll();
} else if (shot === '3' || shot === 'roadmap') {
  showView('roadmap');
  document.body.classList.add('shot-roadmap');
} else if (shot === '4' || shot === 'sources') {
  showView('sources');
}

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    showView('checklist');
    document.querySelector('#search').focus();
  }
});
