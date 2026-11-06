# AGENTS.md — TeamSync

Create fair, random teams in seconds — a free micro-app by Simeon "Moni" Tsvetanov (GitHub Pages PWA + core library + local MCP).

## Read first
1. `STATUS.md` (current state, next step). 2. `docs/SPEC.md` + `docs/PLAN.md`. 3. `docs/DECISIONS.md`.
4. `app.config.ts` — the single source for menu, help, legal, SEO, llms.txt.

## Rules
- Talk to Moni in **Bulgarian**; every file, commit and issue in **English**.
- Follow the forge plugin (`forge-workflow` + `forge-stack`). Cloud session without the plugin:
  read `simeonts-microapp-forge/plugins/*/skills/*/SKILL.md` for the area, then only the chapters
  it points to; agents are in `plugins/*/agents/*.md`.
- Run `pnpm verify` before saying "done"; keep working while it fails.
- Moni corrects/dislikes something → apply it and add an entry to `LEARNINGS.md`.
- Decisions → `docs/DECISIONS.md` (date · decision · reason) the same day. Update `STATUS.md` (≤ 30 lines).
- Never hand-edit generated files (`app/public/*.txt|xml|html`, policy pages, `LICENSE`) — edit
  `app.config.ts` / `content/legal/*.md` and run `pnpm generate`.

## Where things are
```
packages/core   pure logic (+ tests)        packages/mcp   local MCP server (npx)
app/            PWA (Vite, Level 1)         content/legal  Terms/Privacy/AI notice/… sources
design/         tokens.css                  scripts/       generate.ts, check-docs.ts, page assets
tests/e2e       Playwright                  docs/          SPEC, PLAN, DECISIONS, API, ASSETS (dev)
tests/docs      docs screenshots (shots.ts) docs/how-to|reference|about|images  user docs (English, docs-writer)
```

## Commands
`pnpm i` · `pnpm dev` · `pnpm verify` (lint+typecheck+test+docs:check+build) · `pnpm e2e` · `pnpm generate` ·
`pnpm docs:images` (light+dark docs screenshots)
