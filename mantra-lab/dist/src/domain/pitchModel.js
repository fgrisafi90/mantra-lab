import { canPlaySlot } from './compatibility.js';

export function eligiblePlayersForSlot(squad, slot, assignments) {
  const used = new Set(Object.values(assignments).filter(Boolean));
  return squad.filter(player => !used.has(player.id) && canPlaySlot(player, slot));
}

export function setLineupPlayer(assignments, slotId, player) {
  const already = Object.entries(assignments).find(([id, playerId]) => id !== slotId && playerId === player.id);
  if (already) throw new Error('Giocatore già schierato');
  return { ...assignments, [slotId]: player.id };
}
