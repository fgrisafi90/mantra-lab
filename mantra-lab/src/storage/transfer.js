import { isValidPlayer } from '../domain/types.js';

export function exportSquad(players) {
  if (!Array.isArray(players) || !players.every(isValidPlayer)) throw new Error('Rosa non valida');
  return JSON.stringify({ version: 1, players }, null, 2);
}

export function importSquad(json) {
  let parsed;
  try { parsed = JSON.parse(json); }
  catch (error) { throw new Error(`JSON non valido: ${error.message}`); }
  const players = Array.isArray(parsed) ? parsed : parsed?.players;
  if (!Array.isArray(players) || !players.every(isValidPlayer)) throw new Error('File rosa non valido');
  return players;
}
