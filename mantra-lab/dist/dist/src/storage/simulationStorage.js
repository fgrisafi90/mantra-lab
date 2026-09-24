import { isValidPlayer } from '../domain/types.js';

const KEY = 'mantra-lab:auction-simulations:v1';

function validSimulation(sim) {
  return Boolean(
    sim && typeof sim.id === 'string' && typeof sim.name === 'string' &&
    Array.isArray(sim.players) && sim.players.every(isValidPlayer) &&
    typeof sim.formationId === 'string' && sim.lineup && typeof sim.lineup === 'object' && !Array.isArray(sim.lineup)
  );
}

function makeId() {
  return `sim-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

export function createSimulation(name = 'Nuova simulazione') {
  return { id: makeId(), name, players: [], formationId: '3-4-1-2', lineup: {} };
}

export function duplicateSimulation(simulation, name = `${simulation?.name || 'Simulazione'} copia`) {
  if (!validSimulation(simulation)) throw new Error('Simulazione non valida');
  return {
    id: makeId(),
    name,
    players: simulation.players.map(player => ({ ...player, roles: [...player.roles] })),
    formationId: simulation.formationId,
    lineup: { ...simulation.lineup }
  };
}

export function loadSimulations(storage = globalThis.localStorage) {
  const raw = storage?.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(validSimulation) : [];
  } catch {
    return [];
  }
}

export function saveSimulations(simulations, storage = globalThis.localStorage) {
  if (!Array.isArray(simulations) || !simulations.every(validSimulation)) throw new Error('Simulazioni non valide');
  storage?.setItem(KEY, JSON.stringify(simulations));
}
