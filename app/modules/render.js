const gradeShort = { platinum: 'PLAT', gold: 'GOLD', silver: 'SILV', bronze: 'BRNZ' };
const kindLabels = {
  all: 'ALL', story: 'STORY', collectible: 'COLLECTIBLES', activity: 'ACTIVITIES',
  strangers: 'STRANGERS', heist_combat: 'HEISTS / COMBAT', exploration: 'EXPLORATION', platinum: 'PLATINUM',
};
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export function initializeTabs(onSelect) {
  const container = document.querySelector('#kindTabs');
  for (const [key, label] of Object.entries(kindLabels)) {
    const button = document.createElement('button');
    button.className = `kind-tab${key === 'all' ? ' selected' : ''}`;
    button.dataset.kind = key;
    button.textContent = label;
    button.addEventListener('click', () => {
      container.querySelector('.selected')?.classList.remove('selected');
      button.classList.add('selected');
      onSelect(key);
    });
    container.append(button);
  }
}

export function renderDashboard(trophies, earned) {
  const total = trophies.length;
  const count = earned.size;
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) grades[trophy.grade]++;
  document.querySelector('#overall').textContent = `${Math.round(count / total * 100)}%`;
  document.querySelector('#earnedCount').textContent = `${count} / ${total}`;
  document.querySelector('#progressFill').style.width = `${count / total * 100}%`;
  document.querySelector('#gradeCounts').innerHTML = [[grades.platinum, 'P'], [grades.gold, 'G'], [grades.silver, 'S'], [grades.bronze, 'B']].map(([count, letter]) => `<span>${String(count).padStart(2, '0')} <i>${letter}</i></span>`).join('');
  const missables = trophies.filter((t) => t.missable !== 'none' && !earned.has(t.name));
  document.querySelector('#missableCount').textContent = String(missables.length).padStart(2, '0');
  const next = trophies.find((t) => !earned.has(t.name));
  document.querySelector('#nextTrophy').textContent = next ? `NEXT UP · ${next.name}` : 'NEXT UP · PLATINUM COMPLETE';
}

export function renderTrophies(trophies, state, filters, openGuide) {
  const list = document.querySelector('#trophyList');
  list.replaceChildren();
  const query = filters.search.trim().toLowerCase();
  const matches = trophies.filter((t) => {
    const done = state.earned.has(t.name);
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.status === 'earned' && !done) return false;
    if (filters.status === 'unearned' && done) return false;
    if (filters.status === 'missable' && t.missable === 'none') return false;
    const concealed = state.hideSpoilers && t.hidden && !done && !state.revealed.has(t.name);
    return !query || (!concealed && `${t.name} ${t.description} ${t.guide} ${t.kind}`.toLowerCase().includes(query));
  });
  document.querySelector('#resultCount').textContent = `${String(matches.length).padStart(2, '0')} ENTRIES`;
  if (!matches.length) {
    list.innerHTML = '<div class="empty-state">No trophies match this filter.<br><span>Try clearing a category or search term.</span></div>';
    return;
  }
  for (const trophy of matches) {
    const earned = state.earned.has(trophy.name);
    const concealed = state.hideSpoilers && trophy.hidden && !earned && !state.revealed.has(trophy.name);
    const row = document.createElement('article');
    row.className = `trophy-row${earned ? ' is-earned' : ''}${concealed ? ' is-hidden' : ''}`;
    row.innerHTML = `<button class="earned-check" aria-label="${earned ? 'Mark not earned' : 'Mark earned'}: ${escapeHTML(trophy.name)}" title="Toggle earned">${earned ? '✓' : ''}</button>
      <div class="trophy-name"><button class="name-button">${concealed ? 'CLASSIFIED STORY DETAIL' : escapeHTML(trophy.name)}</button><p>${concealed ? 'Story spoiler hidden until earned or revealed.' : escapeHTML(trophy.description)}</p></div>
      <span class="kind-badge">${escapeHTML((trophy.kind || 'activity').replace('_', ' '))}</span><span class="grade-badge ${escapeHTML(trophy.grade)}">${gradeShort[trophy.grade] || trophy.grade}</span>
      ${concealed ? '<button class="reveal-button">REVEAL</button>' : '<button class="row-open" aria-label="Open guide">↗</button>'}`;
    row.querySelector('.earned-check').addEventListener('click', () => {
      if (earned) state.earned.delete(trophy.name); else state.earned.add(trophy.name);
      openGuide?.saveAndRender();
    });
    row.querySelector('.name-button').addEventListener('click', () => { if (!concealed) openGuide(trophy); });
    row.querySelector('.row-open')?.addEventListener('click', () => openGuide(trophy));
    row.querySelector('.reveal-button')?.addEventListener('click', () => {
      state.revealed.add(trophy.name);
      openGuide.saveAndRender();
    });
    list.append(row);
  }
}

export function renderRoadmap(trophies, state, openGuide) {
  const stages = [
    ['01', 'First steps', 'Chapters 1–2 · meet the core systems', 'Secure early story trophies and note any one-time prompts while learning the map.'],
    ['02', 'Build momentum', 'Chapters 3–4 · story & partner play', 'Progress through named missions; add partner-dependent conditions to your watchlist.'],
    ['03', 'Keep the wheels turning', 'Open world · activity sweep', 'Work through races, ranges, stunts, side characters and the app-based discoveries.'],
    ['04', 'Leonida, corner to corner', 'Exploration · collections · properties', 'Use each trophy’s cited count and track its named requirement before moving on.'],
    ['05', 'Final audit', 'Cleanup · 100% · platinum', 'Review the official descriptions, clear remaining requirements, then close with the platinum.'],
  ];
  const root = document.querySelector('#roadmapStages');
  root.innerHTML = stages.map(([number, title, subtitle, copy], index) => {
    const stageTrophies = trophies.filter((t) => t.roadmapStage === index + 1);
    return `<article class="roadmap-card"><div class="roadmap-number">${number}<span> / 05</span></div><div class="roadmap-content"><div class="eyebrow">${escapeHTML(subtitle)}</div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(copy)}</p><div class="stage-count">${stageTrophies.length} TROPHIES · ${String(stageTrophies.filter(t => t.missable !== 'none').length).padStart(2, '0')} WATCH ITEMS</div><div class="stage-pills">${stageTrophies.slice(0, 8).map(t => { const masked = state.hideSpoilers && t.hidden && !state.earned.has(t.name) && !state.revealed.has(t.name); return `<button data-id="${t.id}">${masked ? 'CLASSIFIED' : escapeHTML(t.name)}</button>`; }).join('')}${stageTrophies.length > 8 ? `<span>+${stageTrophies.length - 8} more</span>` : ''}</div></div></article>`;
  }).join('');
  root.querySelectorAll('[data-id]').forEach((button) => button.addEventListener('click', () => openGuide(trophies.find(t => t.id === Number(button.dataset.id)))));
}

export function renderMissables(trophies, state, openGuide) {
  const items = trophies.filter((t) => t.missable !== 'none');
  const root = document.querySelector('#missableList');
  root.innerHTML = items.map((trophy) => { const earned = state.earned.has(trophy.name); const masked = state.hideSpoilers && trophy.hidden && !earned && !state.revealed.has(trophy.name); return `<button class="watch-row ${earned ? 'watch-earned' : ''}" data-id="${trophy.id}"><span class="watch-symbol">${earned ? '✓' : '!'}</span><span><b>${masked ? 'CLASSIFIED STORY DETAIL' : escapeHTML(trophy.name)}</b><small>${escapeHTML(trophy.missableNote || 'Check the cited guide before advancing.')}</small></span><em>${trophy.missable === 'choice_sensitive' ? 'CHOICE' : 'MISSABLE'}</em><span class="watch-arrow">↗</span></button>`; }).join('');
  root.querySelectorAll('[data-id]').forEach((button) => button.addEventListener('click', () => openGuide(trophies.find(t => t.id === Number(button.dataset.id)))));
}

export function renderBibliography(trophies, referenceLibrary = []) {
  const unique = new Map();
  for (const trophy of trophies) for (const source of (trophy.sources || [])) unique.set(source.url, source);
  for (const source of referenceLibrary) unique.set(source.url, source);
  document.querySelector('#bibliography').innerHTML = [...unique.values()].map((source, index) => `<a class="bibliography-row" href="${escapeHTML(source.url)}" target="_blank" rel="noreferrer"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHTML(source.name)}</strong><small>${escapeHTML(new URL(source.url).hostname)}</small><i>↗</i></a>`).join('');
}

export { escapeHTML };
