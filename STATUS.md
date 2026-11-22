# STATUS — TeamSync

**Updated:** 2026-11-22 · **Phase:** 4 (live) · v1.0.2 live; v1.0.3 prepared (Quizzard TS-01 + TS-02), not tagged yet

## Done
- Intake (DECISIONS 2026-11-05) · SPEC approved 2026-11-06 · accent + logo approved.
- Forge template 0.8.1 merged 2026-11-06: code-quality ESLint rules, layered mobile-first CSS
  (teams CSS → components/teams-*.css), view.ts split into 6 modules with TSDoc, docs tooling
  (docs:check, docs:images). verify green (52 unit), e2e 72/72 (chromium + mobile), no visual change.
- Forge 0.10.0 SEO merged 2026-11-07 (no hreflang, full OG, spec llms.txt, FAQ collapsed on phones); e2e 76/76.
- Forge 0.12.0 PWA merged 2026-11-07 (offline-only fallback, safe updates); e2e 82/82.
- Forge 0.14.0 compliance merged 2026-11-07 (licence texts, Privacy/AI notice/Support updated); compliance-check 0 FAIL; e2e 82/82. Live licence file 404 until deploy.
- Forge 0.15.0 a11y merged 2026-11-08 + TeamSync a11y fixes (DECISIONS 2026-11-08); a11y-check 0 FAIL with `tests/a11y-screens.json`, EN + BG.
- Quizzard TS-01 2026-11-22: team screen = `packages/miniapp` behind the mini-app contract; no visible change.
- Quizzard TS-02 2026-11-22: e2e split — `tests/e2e/miniapp/` (screen flows, also run by Quizzard behind
  `#/teams` via `support/entry.ts` + `support/host.ts`) and `tests/e2e/shell/` (standalone only); pending
  names save flushed at unmount/pagehide/hidden; all versions 1.0.3.

## Next
- Dependabot PR (minor/patch group) + 9 build-time alerts; lawyer review items; evals variance (forge).
- Release v1.0.3 (Moni): merge, then GitHub Release `v1.0.3` on `main` → `publish.yml` publishes npm core+mcp;
  Pages deploys; then `E2E_BASE_URL=<live URL> pnpm e2e` (both suites) against the live site; Quizzard T-10 pins the tag.
- T-01–T-09 done: core + MCP (39 unit tests), main screen EN/BG, remember list, ?teams, embed, Copy/Share, texts + legal filled, e2e 62 pass (AC1, AC3–AC7, dark-mode axe).

## Blockers / open
- CI green on 5 browsers (162 e2e) + Lighthouse 100/100/100/100 (2026-11-06).
- WhatsApp sharing in + out done (Moni 2026-11-06).
- GitHub issues for the tasks: only after Moni's OK (public action).
