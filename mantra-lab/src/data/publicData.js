function validSignals(s) {
  return s && typeof s === 'object' && typeof s.availability === 'number' && typeof s.expectedMinutes === 'number';
}

export function parseMatchdayDataset(value) {
  if (!value || typeof value !== 'object' || typeof value.generatedAt !== 'string' || !Number.isInteger(value.matchday) || !Array.isArray(value.fixtures) || !Array.isArray(value.players) || !Array.isArray(value.sources)) {
    throw new Error('Dataset giornata non valido');
  }
  return value;
}

export function isDatasetStale(dataset, now = new Date().toISOString(), maxAgeHours = 36) {
  const age = new Date(now).getTime() - new Date(dataset.generatedAt).getTime();
  return !Number.isFinite(age) || age > maxAgeHours * 3600_000;
}

const norm = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

export function playerSignalsFromDataset(player, dataset) {
  const name = norm(player.name), club = norm(player.club);
  const tokens = name.split(' ').filter(Boolean);
  const surname = tokens.at(-1) || '';
  const candidates = (dataset?.players || []).filter(row => {
    const rn = norm(row.name);
    return rn === name || (surname.length >= 4 && rn.split(' ').includes(surname)) || (rn.length >= 4 && name.split(' ').includes(rn));
  });
  const exactClub = candidates.find(row => {
    const rc = norm(row.club);
    return !club || !rc || rc === club;
  });
  const found = exactClub || (candidates.length === 1 ? candidates[0] : null);
  return validSignals(found?.signals) ? found.signals : null;
}


export function resolveMatchdayDataUrl(pathname = '') {
  return String(pathname).includes('/dist/')
    ? '../src/data/generated/current-matchday.json'
    : './src/data/generated/current-matchday.json';
}

export async function loadPublicData(url = './src/data/generated/current-matchday.json', fetchImpl = fetch, bustCache = false, now = Date.now()) {
  try {
    const requestedUrl = bustCache ? `${url}${url.includes('?') ? '&' : '?'}refresh=${now}` : url;
    const response = await fetchImpl(requestedUrl, { cache:'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { dataset: parseMatchdayDataset(await response.json()), error: null };
  } catch (error) {
    return { dataset: null, error: String(error?.message || error) };
  }
}
