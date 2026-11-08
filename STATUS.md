# STATUS — TeamSync

**Updated:** 2026-11-08 · **Phase:** 4 (live) · v1.0.1 released: Pages, wiki, npm core+mcp via trusted publishing (provenance)

## Done
- Intake (DECISIONS 2026-11-05) · SPEC approved 2026-11-06 · accent + logo approved.
- Forge template 0.8.1 merged 2026-11-06: code-quality ESLint rules, layered mobile-first CSS
  (teams CSS → components/teams-*.css), view.ts split into 6 modules with TSDoc, docs tooling
  (docs:check, docs:images). verify green (52 unit), e2e 72/72 (chromium + mobile), no visual change.
- Forge 0.10.0 SEO merged 2026-11-07 (no hreflang, full OG, spec llms.txt, FAQ collapsed on phones); e2e 76/76.
- Forge 0.12.0 PWA merged 2026-11-07 (offline-only fallback, safe updates); e2e 82/82.
- Forge 0.14.0 compliance merged 2026-11-07 (licence texts, Privacy/AI notice/Support updated); compliance-check 0 FAIL; e2e 82/82. Live licence file 404 until deploy.
- Forge 0.15.0 a11y merged 2026-11-08 + TeamSync a11y fixes (DECISIONS 2026-11-08); a11y-check 0 FAIL with `tests/a11y-screens.json`, EN + BG.

## Next
- Dependabot PR (minor/patch group) + 9 build-time alerts; lawyer review items; evals variance (forge).
- Next release: publish a GitHub Release → `publish.yml` publishes npm (no Codespace needed).
- T-01–T-09 done: core + MCP (39 unit tests), main screen EN/BG, remember list, ?teams, embed, Copy/Share, texts + legal filled, e2e 62 pass (AC1, AC3–AC7, dark-mode axe).

## Blockers / open
- CI green on 5 browsers (162 e2e) + Lighthouse 100/100/100/100 (2026-11-06).
- WhatsApp sharing in + out done (Moni 2026-11-06).
- GitHub issues for the tasks: only after Moni's OK (public action).
