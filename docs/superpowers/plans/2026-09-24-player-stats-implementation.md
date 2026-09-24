# Mantra Lab Player Stats & Auction Credits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable player-statistics panel with avatars and Fantacalcio.it-backed data for every player in Mantra Lab, plus optional purchase-price entry when adding players from the catalog.

**Architecture:** Keep public player statistics separate from local squad data. A GitHub Actions pipeline fetches and normalizes Fantacalcio.it data into a generated JSON dataset; the browser loads that dataset once and uses a shared player-detail panel everywhere. Squad price/budget data remains in existing localStorage-backed storage and is never mixed into public stats.

**Tech Stack:** Vanilla JavaScript ES modules, HTML/CSS, Node.js scripts, GitHub Actions, JSON generated datasets, Node test runner/assertions used by the current project.

**Spec:** `docs/superpowers/specs/2026-09-24-player-stats-design.md`

## Global Constraints

- Navigation labels remain exactly: `Giornata`, `Formazione`, `Rosa`, `Simulatore`, `Asta`.
- Real squad data must remain separate from simulator data.
- Existing real squad and budget data in localStorage must not be cleared or migrated destructively.
- Fantacalcio.it is the only source for player statistics shown in the player panel.
- The browser must not scrape Fantacalcio.it directly.
- Generated stats must be refreshed through GitHub Actions and committed only when data changes.
- If the source is unavailable or its structure changes, preserve the last valid generated dataset.
- Purchase price entered while adding from catalog is optional.
- Avatar failures must degrade to a local visual fallback and must never block the panel.

## Review Focus

- Players with duplicate/similar names must never be matched to the wrong statistics row.
- Missing avatar URLs or broken image requests must render a fallback without layout shift.
- Missing/unpublished matchday votes must not be treated as official.
- Existing local squad entries without `purchasePrice` must continue to load and render normally.
- A source parsing failure must not overwrite `player-stats.json` with an empty/partial dataset.

---

### Task 1: Lock current paths and restore correct deploy entrypoints

**Files:**
- Inspect/Modify: `index.html`
- Inspect/Modify: `mantra-lab/index.html`
- Inspect/Modify: `mantra-lab/dist/index.html` if it exists
- Test: `mantra-lab/tests/app-shell.test.js`

**Interfaces:**
- Consumes: current GitHub Pages root redirect and nested app entrypoint.
- Produces: one canonical app entrypoint loading `mantra-lab/src/app/main.js` with a fresh cache-busting query.

- [ ] **Step 1: Write a failing regression test**

Add assertions to `mantra-lab/tests/app-shell.test.js` that:
1. root `index.html` redirects to `./mantra-lab/index.html`;
2. nested `mantra-lab/index.html` contains `<div id="app"></div>`;
3. nested `mantra-lab/index.html` loads `./src/app/main.js`;
4. no nested `mantra-lab/mantra-lab/index.html` path is referenced.

Example:
```js
test('GitHub Pages root points to the canonical nested app', async () => {
  const root = await fs.readFile('../index.html', 'utf8');
  const nested = await fs.readFile('index.html', 'utf8');

  assert.match(root, /\.\/mantra-lab\/index\.html/);
  assert.match(nested, /<div id="app"><\/div>/);
  assert.match(nested, /\.\/src\/app\/main\.js\?v=/);
  assert.doesNotMatch(root + nested, /mantra-lab\/mantra-lab/);
});
```

- [ ] **Step 2: Run the targeted test and verify RED**

Run:
```bash
cd mantra-lab
node --test tests/app-shell.test.js
```

Expected: fail if the accidental nested path still exists or the canonical entrypoint is wrong.

- [ ] **Step 3: Make the minimum entrypoint correction**

Keep root as redirect only, and keep `mantra-lab/index.html` as the real application shell. Update only the script query value, e.g.:
```html
<script type="module" src="./src/app/main.js?v=20260924-playerstats"></script>
```

- [ ] **Step 4: Run the targeted test and verify GREEN**

```bash
node --test tests/app-shell.test.js
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add index.html mantra-lab/index.html mantra-lab/tests/app-shell.test.js
git commit -m "fix: restore canonical Mantra Lab entrypoint"
```

---

### Task 2: Add player-stats domain model and matching

**Files:**
- Create: `mantra-lab/src/domain/playerStats.js`
- Test: `mantra-lab/tests/playerStats.test.js`

**Interfaces:**
- Consumes: catalog players shaped like `{ name, club, roles, catalogId }`.
- Produces:
  - `normalizePlayerStatsDataset(raw)`
  - `buildPlayerStatsIndex(dataset)`
  - `findPlayerStats(player, index)`

- [ ] **Step 1: Write failing tests**

Create `tests/playerStats.test.js` with cases for:
```js
test('indexes stats by stable source id when available', () => {});
test('falls back to normalized name plus club', () => {});
test('does not match ambiguous same-name players', () => {});
test('normalizes missing numeric stats to null rather than zero', () => {});
```

Expected shape:
```js
{
  sourceId: '123',
  name: 'Mario Rossi',
  club: 'Milan',
  roles: ['A'],
  avatarUrl: null,
  seasonStats: {
    appearances: null,
    ratedMatches: null,
    averageRating: null,
    fantasyAverage: null,
    goals: null,
    assists: null,
    yellowCards: null,
    redCards: null,
    ownGoals: null,
    penaltiesScored: null,
    penaltiesTotal: null
  },
  matchdays: []
}
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/playerStats.test.js
```

Expected: fail because module does not exist.

- [ ] **Step 3: Implement minimal domain helpers**

Implement:
```js
export function normalizeKey(value='') {
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function buildPlayerStatsIndex(dataset) {
  // bySourceId + byNameClub + ambiguous-name protection
}

export function findPlayerStats(player, index) {
  // exact sourceId first; then exact normalized name+club only
}
```

Never perform fuzzy name-only matching.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/playerStats.test.js
```

- [ ] **Step 5: Commit**

```bash
git add mantra-lab/src/domain/playerStats.js mantra-lab/tests/playerStats.test.js
git commit -m "feat: add player stats matching model"
```

---

### Task 3: Add browser-side stats dataset loader

**Files:**
- Create: `mantra-lab/src/data/playerStatsData.js`
- Create: `mantra-lab/src/data/generated/player-stats.json`
- Mirror if current deploy requires it: `mantra-lab/dist/src/data/playerStatsData.js`
- Mirror generated file only if current Pages path requires it
- Test: `mantra-lab/tests/playerStatsData.test.js`

**Interfaces:**
- Produces:
  - `resolvePlayerStatsUrl()`
  - `loadPlayerStats({ fetchImpl = fetch })`

- [ ] **Step 1: Write failing tests**

Cover:
```js
test('loads generated stats with no-store cache', async () => {});
test('returns an empty safe dataset when fetch fails', async () => {});
test('uses the canonical published path when opened from nested app', () => {});
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/playerStatsData.test.js
```

- [ ] **Step 3: Implement the loader**

Use:
```js
export async function loadPlayerStats({ fetchImpl = fetch } = {}) {
  try {
    const response = await fetchImpl(resolvePlayerStatsUrl(), { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch {
    return { generatedAt: null, season: null, players: [] };
  }
}
```

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/playerStatsData.test.js
```

- [ ] **Step 5: Commit**

```bash
git add mantra-lab/src/data/playerStatsData.js mantra-lab/src/data/generated/player-stats.json mantra-lab/tests/playerStatsData.test.js
git commit -m "feat: load generated player stats dataset"
```

---

### Task 4: Add reusable avatar component and fallback behavior

**Files:**
- Create: `mantra-lab/src/ui/playerAvatar.js`
- Modify: `mantra-lab/src/styles/app.css`
- Test: `mantra-lab/tests/playerAvatar.test.js`

**Interfaces:**
- Produces:
  - `renderPlayerAvatar({ name, avatarUrl, size = 'sm' })`
  - stable fallback initials.

- [ ] **Step 1: Write failing tests**

```js
test('renders lazy image when avatar is available', () => {});
test('renders initials fallback when avatar is missing', () => {});
test('includes an error fallback hook for broken image URLs', () => {});
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/playerAvatar.test.js
```

- [ ] **Step 3: Implement minimal renderer**

Expected output pattern:
```html
<span class="player-avatar player-avatar--sm" data-avatar-fallback="MR">
  <img loading="lazy" ...>
  <span class="player-avatar__fallback">MR</span>
</span>
```

CSS must keep fixed dimensions to avoid layout shift.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/playerAvatar.test.js
```

- [ ] **Step 5: Commit**

```bash
git add mantra-lab/src/ui/playerAvatar.js mantra-lab/src/styles/app.css mantra-lab/tests/playerAvatar.test.js
git commit -m "feat: add player avatars with fallback"
```

---

### Task 5: Build the reusable player-detail panel

**Files:**
- Create: `mantra-lab/src/ui/playerPanel.js`
- Modify: `mantra-lab/src/styles/app.css`
- Test: `mantra-lab/tests/playerPanel.test.js`

**Interfaces:**
- Consumes: catalog player + optional normalized stats.
- Produces:
  - `renderPlayerPanel(player, stats)`
  - `bindPlayerPanel({ root, onClose })`

- [ ] **Step 1: Write failing tests**

Cover:
```js
test('renders avatar, player identity and season summary', () => {});
test('renders matchday history', () => {});
test('shows safe unavailable state when no stats exist', () => {});
test('does not invent zero values for missing stats', () => {});
test('renders starter, sub, unused, injured and suspended states', () => {});
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/playerPanel.test.js
```

- [ ] **Step 3: Implement minimal panel**

The panel must include:
```html
<div class="player-panel-backdrop">
  <aside class="player-panel" role="dialog" aria-modal="true">
    <!-- avatar + identity -->
    <!-- season KPI grid -->
    <!-- matchday history -->
  </aside>
</div>
```

Close behavior:
- close button;
- backdrop tap;
- `Escape` key on desktop.

Do not navigate away from the current section.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/playerPanel.test.js
```

- [ ] **Step 5: Commit**

```bash
git add mantra-lab/src/ui/playerPanel.js mantra-lab/src/styles/app.css mantra-lab/tests/playerPanel.test.js
git commit -m "feat: add reusable player statistics panel"
```

---

### Task 6: Make every player entry open the same panel

**Files:**
- Modify: `mantra-lab/src/app/main.js`
- Test: `mantra-lab/tests/app-shell.test.js`

**Interfaces:**
- Consumes: `loadPlayerStats`, `buildPlayerStatsIndex`, `findPlayerStats`, `renderPlayerPanel`.
- Produces: a shared `openPlayerPanel(player)` action.

- [ ] **Step 1: Write failing integration tests**

Add tests/assertions that generated markup contains a player-profile trigger in:
- Rosa list;
- catalog/listone result;
- Asta player context if players are rendered there;
- Simulatore demo roster/picker;
- Formazione player picker/assigned player labels.

Use a common attribute:
```html
data-player-profile="catalog-or-squad-id"
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/app-shell.test.js
```

- [ ] **Step 3: Implement shared opening logic**

At app initialization:
```js
const playerStatsDataset = await loadPlayerStats();
const playerStatsIndex = buildPlayerStatsIndex(playerStatsDataset);
```

Add one delegated click handler:
```js
app.addEventListener('click', event => {
  const trigger = event.target.closest('[data-player-profile]');
  if (!trigger) return;
  const player = resolvePlayerByUiId(trigger.dataset.playerProfile);
  openPlayerPanel(player);
});
```

Do not create section-specific panels.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/app-shell.test.js
```

- [ ] **Step 5: Commit**

```bash
git add mantra-lab/src/app/main.js mantra-lab/tests/app-shell.test.js
git commit -m "feat: open player stats from all app sections"
```

---

### Task 7: Add optional purchase-price prompt when adding from catalog

**Files:**
- Modify: `mantra-lab/src/app/main.js`
- Modify if needed: `mantra-lab/src/storage/squadStorage.js`
- Test: `mantra-lab/tests/budgetStorage.test.js`
- Test: `mantra-lab/tests/app-shell.test.js`

**Interfaces:**
- Consumes: existing `saveSquad`, `summarizeBudget`.
- Produces: catalog-add confirmation dialog with optional `purchasePrice`.

- [ ] **Step 1: Write failing tests**

Cover:
```js
test('catalog add dialog allows empty purchase price', () => {});
test('empty price stores player without purchasePrice', () => {});
test('numeric price stores purchasePrice and updates budget summary', () => {});
test('negative price is rejected', () => {});
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/budgetStorage.test.js tests/app-shell.test.js
```

- [ ] **Step 3: Implement minimal dialog**

Replace immediate catalog add with:
```html
<form id="catalog-add-form">
  <input name="price" type="number" min="0" step="1" inputmode="numeric">
  <button type="submit">Aggiungi alla rosa</button>
</form>
```

On submit:
```js
const raw = form.elements.price.value.trim();
const purchasePrice = raw === '' ? undefined : Number(raw);
```

Only include `purchasePrice` when finite and non-negative.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/budgetStorage.test.js tests/app-shell.test.js
```

- [ ] **Step 5: Commit**

```bash
git add mantra-lab/src/app/main.js mantra-lab/src/storage/squadStorage.js mantra-lab/tests/budgetStorage.test.js mantra-lab/tests/app-shell.test.js
git commit -m "feat: make catalog purchase price optional"
```

---

### Task 8: Build Fantacalcio source adapter with local fixtures

**Files:**
- Create: `mantra-lab/scripts/sources/fantacalcioStatsSource.mjs`
- Create: `mantra-lab/tests/fixtures/fantacalcio/player-stats.html`
- Create: `mantra-lab/tests/fixtures/fantacalcio/votes.html`
- Test: `mantra-lab/tests/fantacalcioStatsSource.test.js`

**Interfaces:**
- Produces:
  - `parseSeasonStats(html)`
  - `parseMatchdayVotes(html)`
  - `fetchFantacalcioStats({ fetchImpl })`

- [ ] **Step 1: Capture minimal legal test fixtures**

Store only the minimal HTML fragments required to exercise parsing; do not copy entire pages.

- [ ] **Step 2: Write failing parser tests**

Cover:
```js
test('parses season totals and averages', () => {});
test('parses avatar URL', () => {});
test('parses official matchday votes', () => {});
test('maps appearance status when present', () => {});
test('throws a typed source-layout error when required selectors disappear', () => {});
```

- [ ] **Step 3: Verify RED**

```bash
node --test tests/fantacalcioStatsSource.test.js
```

- [ ] **Step 4: Implement parser against the fixtures**

Keep selectors/constants in one place:
```js
export const SELECTORS = {
  playerRow: '...',
  playerName: '...',
  // ...
};
```

Return normalized source rows; do not write generated JSON here.

- [ ] **Step 5: Verify GREEN**

```bash
node --test tests/fantacalcioStatsSource.test.js
```

- [ ] **Step 6: Commit**

```bash
git add mantra-lab/scripts/sources/fantacalcioStatsSource.mjs mantra-lab/tests/fixtures/fantacalcio mantra-lab/tests/fantacalcioStatsSource.test.js
git commit -m "feat: parse Fantacalcio player statistics"
```

---

### Task 9: Add normalization pipeline and generated dataset writer

**Files:**
- Create: `mantra-lab/scripts/playerStatsPipeline.mjs`
- Create: `mantra-lab/scripts/updatePlayerStats.mjs`
- Test: `mantra-lab/tests/playerStatsPipeline.test.js`

**Interfaces:**
- Consumes: source rows from `fetchFantacalcioStats`.
- Produces: `src/data/generated/player-stats.json`.

- [ ] **Step 1: Write failing pipeline tests**

Cover:
```js
test('merges season totals with matchday rows by stable player identity', () => {});
test('preserves previous dataset when source fetch fails', () => {});
test('does not write ambiguous player matches', () => {});
test('marks generatedAt only on successful refresh', () => {});
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/playerStatsPipeline.test.js
```

- [ ] **Step 3: Implement pipeline**

`updatePlayerStats.mjs` must:
1. read current generated dataset;
2. fetch source;
3. normalize;
4. validate non-empty sane output;
5. write only valid dataset;
6. on error, log and exit `0` while preserving previous file.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/playerStatsPipeline.test.js
```

- [ ] **Step 5: Commit**

```bash
git add mantra-lab/scripts/playerStatsPipeline.mjs mantra-lab/scripts/updatePlayerStats.mjs mantra-lab/tests/playerStatsPipeline.test.js
git commit -m "feat: generate player statistics dataset"
```

---

### Task 10: Add automatic GitHub Actions refresh

**Files:**
- Create: `.github/workflows/update-player-stats.yml`
- Test: `mantra-lab/tests/workflows.test.js`

**Interfaces:**
- Consumes: `node scripts/updatePlayerStats.mjs`.
- Produces: commits to `mantra-lab/src/data/generated/player-stats.json` when changed.

- [ ] **Step 1: Write failing workflow test**

Assert the workflow:
- uses Node 20+ setup;
- runs in `mantra-lab`;
- invokes `node scripts/updatePlayerStats.mjs`;
- has `contents: write`;
- commits only `src/data/generated/player-stats.json`;
- runs on `workflow_dispatch`;
- runs on an hourly schedule.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/workflows.test.js
```

- [ ] **Step 3: Create workflow**

Use:
```yaml
name: Update player stats

on:
  workflow_dispatch:
  schedule:
    - cron: '17 * * * *'

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mantra-lab
```

Commit only when diff exists.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/workflows.test.js
```

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/update-player-stats.yml mantra-lab/tests/workflows.test.js
git commit -m "ci: refresh Fantacalcio player stats automatically"
```

---

### Task 11: Mirror deploy-critical files only where the current Pages setup requires them

**Files:**
- Modify only if proven necessary by current deploy:
  - `mantra-lab/dist/src/app/main.js`
  - `mantra-lab/dist/src/data/playerStatsData.js`
  - `mantra-lab/dist/src/domain/playerStats.js`
  - `mantra-lab/dist/src/ui/playerAvatar.js`
  - `mantra-lab/dist/src/ui/playerPanel.js`
  - `mantra-lab/dist/src/styles/app.css`
  - `mantra-lab/dist/src/data/generated/player-stats.json`

**Interfaces:**
- Produces: same behavior in the actually served path.

- [ ] **Step 1: Prove whether `dist` is served**

Inspect current `mantra-lab/index.html` and direct GitHub Pages URLs. Do not mirror blindly.

- [ ] **Step 2: Add a regression assertion for the served path**

The test must pin the exact path used by the page.

- [ ] **Step 3: Copy only required modules/data if `dist` is actually served**

No unrelated rebuild/refactor.

- [ ] **Step 4: Verify targeted test**

```bash
node --test tests/app-shell.test.js tests/playerStatsData.test.js
```

- [ ] **Step 5: Commit**

```bash
git add <only-proven-deploy-files>
git commit -m "build: sync player stats to published app path"
```

---

### Task 12: Full verification and live smoke test

**Files:**
- No new production files unless a failing verification exposes a defect.

**Interfaces:**
- Validates the complete feature.

- [ ] **Step 1: Run the full test suite**

```bash
cd mantra-lab
npm test
```

Record every failure. Do not hide the historical missing `deploy-pages.yml` failure if it still exists.

- [ ] **Step 2: Run update scripts locally**

```bash
node scripts/updatePlayerStats.mjs
node scripts/updateMatchdayData.mjs
```

Expected:
- no destructive overwrite on source failure;
- valid JSON files remain parseable.

- [ ] **Step 3: Validate generated JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/data/generated/player-stats.json','utf8')); console.log('player stats json ok')"
```

- [ ] **Step 4: Validate app entrypoint references**

```bash
grep -n "src/app/main.js" index.html
grep -n "mantra-lab/index.html" ../index.html
```

- [ ] **Step 5: Manual smoke test after publish**

Verify on the live URL:
1. real Rosa is still present;
2. budget is still present;
3. adding from catalog offers optional credits;
4. player panel opens from Rosa;
5. player panel opens from catalog;
6. avatar fallback works;
7. stats unavailable state is readable;
8. closing panel returns to the same section/state;
9. Formazione and Simulatore remain separate;
10. no localStorage clearing is required.

- [ ] **Step 6: Final commit only if verification required fixes**

```bash
git add <verified-fix-files>
git commit -m "fix: complete player stats verification"
```
