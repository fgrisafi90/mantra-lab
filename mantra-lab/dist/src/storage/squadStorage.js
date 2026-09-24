import { isValidPlayer } from '../domain/types.js';
const KEY = 'mantra-lab:squad:v1';
const BUDGET_KEY = 'mantra-lab:budget:v1';

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


export function loadBudget(storage = globalThis.localStorage) {
  const raw = storage?.getItem(BUDGET_KEY);
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function saveBudget(value, storage = globalThis.localStorage) {
  if (value == null || value === '') {
    storage?.setItem(BUDGET_KEY, '');
    return;
  }
  const budget = Number(value);
  if (!Number.isFinite(budget) || budget < 0) throw new Error('Budget non valido');
  storage?.setItem(BUDGET_KEY, String(budget));
}

export function summarizeBudget(budget, players = []) {
  const normalizedBudget = budget == null || budget === '' ? null : Number(budget);
  const spent = (Array.isArray(players) ? players : []).reduce((sum, player) => {
    const value = Number(player?.purchasePrice);
    return sum + (Number.isFinite(value) && value >= 0 ? value : 0);
  }, 0);
  return {
    budget: Number.isFinite(normalizedBudget) && normalizedBudget >= 0 ? normalizedBudget : null,
    spent,
    remaining: Number.isFinite(normalizedBudget) && normalizedBudget >= 0 ? normalizedBudget - spent : null
  };
}
