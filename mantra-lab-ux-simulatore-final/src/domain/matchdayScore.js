const clamp = n => Math.max(0, Math.min(100, Number.isFinite(Number(n)) ? Number(n) : 0));

export function scorePlayer(signals) {
  if (signals?.unavailable) {
    return { score: 0, positives: [], negatives: ['Indisponibile confermato'], excluded: true };
  }

  const availabilityMinutes = (clamp(signals?.availability) + clamp(signals?.expectedMinutes)) / 2;
  let score =
    availabilityMinutes * 0.30 +
    clamp(signals?.recentForm) * 0.20 +
    clamp(signals?.opponentContext) * 0.15 +
    clamp(signals?.bonusPotential) * 0.15 +
    clamp(signals?.setPieces) * 0.10 +
    clamp(signals?.homeAwayContext) * 0.05 +
    clamp(signals?.tacticalOpportunity) * 0.05;

  const positives = [];
  const negatives = [];
  if (signals?.majorDoubt) { score -= 15; negatives.push('Forte rischio di ballottaggio o minutaggio ridotto'); }
  if (availabilityMinutes >= 80) positives.push('Titolarità e minutaggio attesi alti');
  else if (availabilityMinutes < 55) negatives.push('Minutaggio atteso limitato');
  if (clamp(signals?.recentForm) >= 75) positives.push('Forma recente positiva');
  if (clamp(signals?.opponentContext) >= 75) positives.push('Avversario favorevole');
  if (clamp(signals?.bonusPotential) >= 75) positives.push('Buon potenziale bonus');
  if (clamp(signals?.setPieces) >= 70) positives.push('Coinvolto su rigori o piazzati');
  if (clamp(signals?.recentForm) <= 35) negatives.push('Forma recente debole');
  if (clamp(signals?.opponentContext) <= 35) negatives.push('Matchup difficile');

  return { score: Math.round(clamp(score)), positives, negatives, excluded: false };
}
