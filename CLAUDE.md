# CLAUDE.md

Guidance for Claude Code and other AI agents working in this repo. Keep these rules in mind for every task.

## Rules (always follow)

- **Never run `npm` or `node` directly on the host.** This project has no host Node toolchain assumption — everything runs in the `node:lts` Docker image. Use the `make` targets or the Docker pattern from the `Makefile`:
  - `make init` — install dependencies (re-run after `package.json` changes)
  - `make start` / `make stop` — dev server via `compose.yaml` (http://localhost:5173)
  - `make build` — production build → `dist/`
  - Ad-hoc commands: `docker run --rm -v .:/app -w /app node:lts npm <cmd>`
  - Add a dependency: `docker run --rm -v .:/app -w /app node:lts npm install <pkg>`
- **Run tests via Docker:** `make test` (or `docker run --rm -v .:/app -w /app node:lts npm test`) — Vitest. Watch mode: `npm run test:watch`.
- **Do not `git add`/stage files you didn't change in the current task.** Stage only the files you actually edited; never blanket-stage with `git add -A` or `git add .`.
- **Do not add things to `.gitignore` that aren't part of the application.** `.gitignore` is only for build artifacts and dependencies (e.g. `node_modules/`, `dist/`). Editor/tool config, temp scratch files, and other local-only files should simply be left untracked — leaving an uncommitted file in the working tree is fine and preferred over ignoring it.
- **Commit or push only when explicitly asked.** If on the default branch, create a branch first.

## Project reference

See @AI.md for the full developer reference: running the app, repository layout, the
compass-draw engine, app state/persistence, and how to extend the code.
