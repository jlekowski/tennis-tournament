# Ace — Tennis Tournament Runner

A phone-first web app for a coach to run an **ad-hoc compass-draw tennis tournament**
courtside, from a smartphone. Set up 6–16 players (singles or doubles), generate the
draw, then tap the winner of each match. Every player gets multiple matches and a final
ranking from #1 to #N.

Built with **React + Vite**. Implemented from a Claude Design handoff (see the original
prototype intent in the design bundle). The compass-draw engine is the part everything
hangs on; it was stress-tested in the design phase (3,300 random play-throughs across
counts 6–16, zero failures) and is ported here verbatim.

## Features

- **Setup** — name the comp, pick singles/doubles and scoring (Quick tap-winner, 1 Set,
  Pro Set, Best of 3), add players, reorder or shuffle to seed (#1 at the top), generate.
- **Up Next** — the courtside view: every match ready to play right now, one tap to record.
- **Draw** — the full compass bracket (East/Main, then West, North, South…) with seeds,
  scores, winners and the placement range each sub-draw decides.
- **Standings** — live #1→#N ranking that firms up as finals complete, champion highlighted.
- **Result sheet** — tap the winner, optionally enter games, mark walkover/retirement.
- **Settings** — accent theme, dark mode, text size (sunlight legibility) and Compass vs.
  Plain bracket labels.
- Tournaments **save automatically** to `localStorage` and resume from Home. A one-time
  demo tournament is seeded on first run so the app opens populated and explorable.

## Project structure

```
index.html              app shell (fonts, root mount)
src/
  main.jsx              entry — mounts <App>
  App.jsx              root state, routing, persistence, theming
  engine/compass.js    pure compass-draw engine (no UI)
  components/ui.jsx    shared primitives (Icon, Seg, Sheet, Toggle, …)
  screens/Home.jsx     resume / start / completed list
  screens/Setup.jsx    players, seeding, format, scoring
  screens/Run.jsx      Up Next / Draw / Standings + result sheet
  settings/settings.jsx  theme tokens, useSettings hook, SettingsSheet
  styles/app.css       design tokens + base styles
  utils.js             shared helpers
  __tests__/           Vitest suite (engine + app)
```

## Running

Everything runs in the `node:lts` Docker image (no host Node toolchain required), via
`make`:

```bash
make init     # install dependencies
make start    # dev server on http://localhost:5173 (make stop to halt)
make build    # production build → dist/
make test     # run the test suite (Vitest)
```

Raw Docker form for ad-hoc commands: `docker run --rm -v .:/app -w /app node:lts npm <cmd>`.
With Node installed locally, just use `npm install`, `npm run dev`, `npm run build`,
`npm test`.

## Notes

- Counts 9–15 use a 16-spot draw, so top seeds get byes — mathematically unavoidable for
  a pure compass at those sizes. Byes auto-resolve to the top seeds and are shown clearly.
- The compass guarantees #1 the moment the main final is played, so the champion can lock
  in before some lower placements finish. That's intended.
- Possible follow-ups (not built): Compass + Round-Robin hybrid for the awkward counts,
  court/time-slot assignment, and a printable/PDF draw sheet.
