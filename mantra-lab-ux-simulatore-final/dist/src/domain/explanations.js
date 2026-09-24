export function explainOptimizedFormation(formation, selectedPlayers, normalizedScore) {
  const multirole = selectedPlayers.filter(x => x.player.roles.length > 1).length;
  const highConfidence = selectedPlayers.filter(x => x.matchday.score >= 75).length;
  const reasons = [`${formation.name} raggiunge un indice formazione di ${normalizedScore}/100.`];
  if (highConfidence) reasons.push(`${highConfidence} titolari hanno un indice giornata almeno 75/100.`);
  if (multirole) reasons.push(`${multirole} giocatori multiruolo vengono sfruttati senza duplicazioni.`);
  return reasons;
}
