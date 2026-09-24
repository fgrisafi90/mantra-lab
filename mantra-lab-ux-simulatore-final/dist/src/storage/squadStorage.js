import { isValidPlayer } from '../domain/types.js';
const KEY = 'mantra-lab:squad:v1';

export function loadSquad(storage = globalThis.localStorage) {
  const raw = storage?.getItem(KEY);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isValidPlayer) : [];
  } catch {
    return [];
  }
}

export function saveSquad(players, storage = globalThis.localStorage) {
  if (!Array.isArray(players) || !players.every(isValidPlayer)) {
    throw new Error('Rosa non valida');
  }
  storage?.setItem(KEY, JSON.stringify(players));
}
