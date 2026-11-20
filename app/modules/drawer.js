import { escapeHTML } from './render.js';

export function createDrawer(trophies, state, saveAndRender) {
  const drawer = document.querySelector('#guideDrawer');
  const content = document.querySelector('#drawerContent');
  let currentIndex = 0;

  function open(trophy) {
    currentIndex = trophies.findIndex((item) => item.id === trophy.id);
    render();
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
  }

  function render() {
    const trophy = trophies[currentIndex];
    const earned = state.earned.has(trophy.name);
    const masked = state.hideSpoilers && trophy.hidden && !earned && !state.revealed.has(trophy.name);
    document.querySelector('#drawerId').textContent = ` / ${String(trophy.id).padStart(2, '0')} OF 55`;
    content.innerHTML = `<div class="drawer-title-row"><span class="grade-badge ${escapeHTML(trophy.grade)}">${escapeHTML(trophy.grade.toUpperCase())}</span><span class="kind-badge">${escapeHTML((trophy.kind || 'activity').replace('_', ' '))}</span></div>
      <h2 id="drawerTitle">${masked ? 'CLASSIFIED STORY DETAIL' : escapeHTML(trophy.name)}</h2><p class="drawer-description">${masked ? 'Story spoiler hidden. Reveal this trophy in the checklist to view its name and guide.' : escapeHTML(trophy.description)}</p>
      ${trophy.missable !== 'none' ? `<div class="missable-alert"><span>⚠ ${trophy.missable === 'choice_sensitive' ? 'CHOICE-SENSITIVE' : 'MISSABLE WATCH'}</span><p>${escapeHTML(trophy.missableNote || 'Review this trophy before advancing the story.')}</p></div>` : ''}
      <div class="guide-copy"><div class="eyebrow">THE ROUTE</div><p>${masked ? 'This story guide is concealed while Hide Story Spoilers is active.' : escapeHTML(trophy.guide)}</p></div>
      ${masked ? '' : `<div class="steps-block"><div class="eyebrow">ORDER OF OPERATIONS</div><ol>${(trophy.steps || []).map((step) => `<li>${escapeHTML(step)}</li>`).join('')}</ol></div>`}
      <div class="drawer-sources"><div class="eyebrow">CITED SOURCES</div><div>${(trophy.sources || []).map((source) => `<a href="${escapeHTML(source.url)}" target="_blank" rel="noreferrer">${escapeHTML(source.name)} <i>↗</i></a>`).join('')}</div></div>
      <button class="mark-earned ${earned ? 'marked' : ''}" id="markEarned">${earned ? '✓ TROPHY EARNED' : '+ MARK AS EARNED'}</button>`;
    document.querySelector('#prevGuide').disabled = currentIndex === 0;
    document.querySelector('#nextGuide').disabled = currentIndex === trophies.length - 1;
    document.querySelector('#prevGuide').onclick = () => move(-1);
    document.querySelector('#nextGuide').onclick = () => move(1);
    document.querySelector('#markEarned').onclick = () => {
      if (earned) state.earned.delete(trophy.name); else state.earned.add(trophy.name);
      saveAndRender();
      render();
    };
  }

  function move(direction) {
    currentIndex = Math.max(0, Math.min(trophies.length - 1, currentIndex + direction));
    render();
  }

  function close() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
  }

  document.querySelector('#closeDrawer').addEventListener('click', close);
  drawer.querySelector('.drawer-scrim').addEventListener('click', close);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  return { open, close };
}
