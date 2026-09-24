export function canPlaySlot(player, slot) {
  return Boolean(player?.active !== false && player?.roles?.some(role => slot.acceptedRoles.includes(role)));
}

export function assignPlayer(assignments, slotId, player, slot) {
  if (!canPlaySlot(player, slot)) throw new Error('Giocatore incompatibile con lo slot');
  if (Object.values(assignments).includes(player.id)) throw new Error('Giocatore già schierato');
  return { ...assignments, [slotId]: player.id };
}
