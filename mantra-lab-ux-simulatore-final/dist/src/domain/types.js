export const MANTRA_ROLES = ['P','Dd','Ds','Dc','B','E','M','C','T','W','A','Pc'];

export function isValidPlayer(player) {
  return Boolean(
    player && typeof player === 'object' &&
    typeof player.id === 'string' && player.id &&
    typeof player.name === 'string' && player.name.trim() &&
    typeof player.club === 'string' &&
    Array.isArray(player.roles) && player.roles.length > 0 &&
    player.roles.every(role => MANTRA_ROLES.includes(role)) &&
    typeof player.active === 'boolean'
  );
}
