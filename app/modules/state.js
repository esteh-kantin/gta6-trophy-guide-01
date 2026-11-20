const STORAGE_KEY = 'leonida-ledger-progress-v1';

export function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      earned: new Set(Array.isArray(value.earned) ? value.earned : []),
      revealed: new Set(Array.isArray(value.revealed) ? value.revealed : []),
      hideSpoilers: Boolean(value.hideSpoilers),
    };
  } catch {
    return { earned: new Set(), revealed: new Set(), hideSpoilers: false };
  }
}

export function saveProgress(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    earned: [...state.earned], revealed: [...state.revealed], hideSpoilers: state.hideSpoilers,
  }));
}

export function applyImport(text, trophies) {
  const parsed = JSON.parse(text);
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) throw new Error('This file does not contain an earned trophy list.');
  const valid = new Set(trophies.map((trophy) => trophy.name));
  return new Set(names.filter((name) => typeof name === 'string' && valid.has(name)));
}
