# AI.md — guide for AI agents

Orientation for AI coding agents working on **Ace**, the compass-draw tennis
tournament runner. Read this before changing code. Human-facing overview lives in
[README.md](README.md); this file covers how to work in the repo safely.

## TL;DR

- Phone-first **React 18 + Vite** SPA, plain JSX (no TypeScript), plain CSS.
- No backend — all state in `localStorage`.
- **No local Node**: run every npm/node command through Docker `node:lts`.
- The compass-draw **engine is load-bearing and pre-validated** — touch with care.
- Ported from a Claude Design HTML/CSS/JS prototype; the device-frame and the
  host-driven "Tweaks" panel were prototype scaffolding and were intentionally
  dropped. Don't reintroduce them.

## Running & verifying

No host Node toolchain — everything runs in the `node:lts` Docker image via `make`
(see `Makefile`):

```bash
make init     # install dependencies (re-run after package.json changes)
make build    # production build → dist/
make test     # Vitest suite
make start    # dev server on http://localhost:5173 (compose.yaml); make stop to halt
```

Ad-hoc / raw form: `docker run --rm -v .:/app -w /app node:lts npm <cmd>`. With
Node 18+ locally, drop the Docker prefix (`npm install`, `npm run build`, `npm test`).

**Before declaring a change done:** run `make build` (catches import/JSX errors) and
`make test`. The Vitest suite lives in `src/__tests__/`:
- `compass.test.js` — engine units + a random-play-through integrity check across
  counts 6–16 (always completes; ranking is always a valid #1..#N permutation).
- `App.test.jsx` — Testing-Library render of `<App>`: the demo seeds, settings
  open/persist, dark mode lands on `<html>`, run-screen tabs switch, new-tournament flow.

## Architecture

```
index.html               Vite entry — fonts, <meta theme-color>, #root mount
src/
  main.jsx               React root; imports global CSS
  App.jsx                routing, persistence, demo seed, theming, SettingsSheet wiring
  engine/compass.js      compass-draw engine — pure logic, no React/DOM
  components/ui.jsx       primitives: Icon, BrandMark, Seed, Seg, Stepper, Sheet,
                          Toggle, SubPill, subMeta(), displayName()
  screens/
    Home.jsx             resume / start / completed list (+ gear → settings)
    Setup.jsx            name, format, scoring, players + seeding
    Run.jsx              Up Next / Draw / Standings tabs + Result bottom-sheet
  settings/settings.jsx  THEMES, SCALE, useSettings(), SettingsSheet
  styles/app.css         design tokens (:root + .dark) and base styles
  utils.js               uid()
  __tests__/             Vitest suite: compass.test.js, App.test.jsx
vitest.config.js         jsdom env; matches src/**/*.test.{js,jsx}
Makefile, compose.yaml   Docker run/build/test/dev targets
dist/                    build output (generated; do not edit)
```

### The engine (`src/engine/compass.js`) — handle with care

Pure functions, no UI. **Stress-tested in the design phase** (3,300 random
play-throughs across counts 6–16, zero failures) and ported verbatim. Do not
refactor its logic without re-validating across all counts.

- A draw is a **static match graph**. `generateDraw(players)` returns a draw whose
  `matches[id]` carry `winner`/`loser`/`score`, an `autoBye` flag, and
  `winnerRank`/`loserRank` on final-round matches.
- Players are seeded by array order (`players[0]` = seed #1). Sizes round up to a
  power of two, min 8 (so 6–8 → 8-spot draw, 9–16 → 16-spot).
- **Byes** are slots with a `null` player; they auto-resolve to the present side
  and are surfaced in the UI. Counts 9–15 give top seeds byes — unavoidable for a
  pure compass; not a bug.
- `placements` is `rank -> playerId` (ranks `1..size`); it is always a valid
  permutation when complete. `standings(draw)` reads it; `isComplete(draw)` checks
  every player has a rank.
- Mutating ops act in place and return the draw: `applyResult(draw, matchId,
  winnerId, score)` and `clearResult(draw, matchId)` (undo — replays remaining
  explicit results from a fresh draw). `readyMatches(draw)` lists currently
  playable matches; `isPlayable` / `feederValue` resolve match feeders.

### App state & persistence (`src/App.jsx`)

- Screens: `home` / `setup` / `run`, switched by local state.
- localStorage keys: `ace.tournaments.v1` (saved tournaments),
  `ace.seeded.v1` (one-time demo guard), `ace.settings.v1` (settings).
- A populated **demo tournament** is seeded on first run so the app opens explorable.
- Theming is applied imperatively to `document.documentElement`: toggles the
  `.dark` class and sets CSS custom properties (`--accent`, `--on-accent`,
  `--accent-soft`, `--s`) plus `<meta name="theme-color">`. Dark mode must land on
  `<html>` (the smoke test asserts this).

### Settings (`src/settings/settings.jsx`)

Production replacement for the prototype's postMessage/edit-mode "Tweaks" panel —
**do not** reintroduce that host plumbing. `useSettings()` is the single source of
truth and persists every change. Options: accent theme (`THEMES`), dark mode, text
size (`SCALE`), bracket labels (Compass vs. Plain). Opened from the Home gear button
and the Run overflow menu via a shared `SettingsSheet` rendered in `App.jsx`.

## Conventions

- CSS classes are namespaced `ace-*`. UI sizing scales with the `--s` custom
  property; write new dimensions as `calc(<px> * var(--s))`.
- Colors come from CSS variables (`var(--ink)`, `var(--accent)`, sub-draw hues
  `--sd-*`). Don't hardcode hex in components — add or reuse a token in `app.css`.
- Keep the engine framework-agnostic (no React/DOM imports). UI imports from it,
  never the reverse.
- `labelStyle` is `"compass"` or `"plain"`, derived from settings and threaded into
  `subMeta()` for sub-draw naming.
- Layout is a centered max-width 480px column; respect safe-area insets via `env()`
  (already wired in `app.css`).

## Intentional behavior (don't "fix")

- 9–15 players → 16-spot draw → top-seed byes. Mathematically unavoidable.
- #1 can be decided the moment the main final is played, before lower placements
  finish. Intended.
- No device bezel / fit-to-viewport / faux status bar — those were preview-only
  prototype scaffolding and were removed on purpose.

## Good next steps (unbuilt)

Compass + round-robin hybrid for awkward counts (avoids byes); court/time-slot
assignment; name-announce mode; printable/PDF draw sheet.
