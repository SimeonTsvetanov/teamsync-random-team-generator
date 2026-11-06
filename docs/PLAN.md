# PLAN — TeamSync

> Status: **approved by Moni 2026-11-06** · Phase 2 output. Based on SPEC approved 2026-11-06.

## 1. Architecture
### core (`@simeonts/teamsync-random-team-generator-core`) — pure TS, no DOM
```ts
// names.ts
export const FOLLOWERS: readonly string[]; // the 17 names, in the old order (SPEC F6)
export function parseNames(text: string): Result<string[], NamesError>;
//   split lines → trim → drop blanks → a line equal to "the followers" (case-insensitive) is
//   replaced in place by FOLLOWERS → max 1,000 names, each ≤ 100 chars.
// teams.ts
export const TeamsInput = z.object({ names: z.array(z.string().min(1).max(100)).min(2).max(1000), teams: z.int().min(2).max(10) });
export function shuffle<T>(items: readonly T[], rng?: (maxExclusive: number) => number): T[]; // Fisher–Yates, crypto by default
export function makeTeams(input: z.input<typeof TeamsInput>, rng?): Result<string[][], TeamsError>;
//   sizes differ by at most 1; teams > names → TEAMS_MORE_THAN_NAMES
// format.ts
export function formatTeams(teams: string[][], labels: { team: (n: number) => string }, attribution: string): string;
```
- Errors (typed, stable codes): `NAMES_EMPTY`, `NAMES_TOO_MANY`, `NAME_TOO_LONG`, `TEAMS_OUT_OF_RANGE`, `TEAMS_MORE_THAN_NAMES`.
- The template example `slug.ts` and its test are removed.

### mcp (`@simeonts/teamsync-random-team-generator-mcp`) — local, stdio
- Tool `make_teams`: input `{ names: string[] | string (one per line), teams: 2–10 }` → output
  structured `{ teams: string[][] }` + a text block (same format as Copy). Errors return
  `isError` with the error code. Cheat applies to string input too (same `parseNames`).

### app (PWA, Level 1)
- `app/src/teams/` — `view.ts` (form + results), `state.ts` (last list in prefs `names`,
  selected team count in prefs `teams`), `embed.ts` (postMessage `teamsync:ready|result|error`).
- Main screen: names textarea (live count "12 names") · teams segmented 2–10 · primary
  **Generate teams** (sticky in the thumb zone on phones) · results: team cards
  (Team N · count · names) + Regenerate · Copy · Share · Clear.
- Strings: `app.*` keys in `app/src/i18n/en.ts` + `bg.ts` (Claude writes + reviews BG).
- Storage: prefs tier only (`names`, `teams`, plus shell prefs). No Dexie/OPFS.

### service
- None (standard app).

## 2. Standard parts used
| Part | Used | Note |
|---|---|---|
| App shell, Help, Settings/Storage, About, What's new, Install, Report | yes | fill help/FAQ, `storage.stores` |
| i18n (EN default + BG) | yes | forge template 0.3.0 |
| Legal + policy pages, 404, error screen | yes | fill `content/legal` placeholders |
| SEO, llms.txt, JSON-LD, OG image, icons | yes | generated from app.config + logo.svg |
| Drop zone / progress | no | text input only, generation is instant |
| Storage module beyond prefs (Dexie/OPFS) | no | a names list is small |
| n8n block / HTTP API / remote MCP | no | standard app; local MCP only |

## 3. Tasks
### T-01 · Names parser + the followers cheat (core)
- Goal: `parseNames` and `FOLLOWERS` exactly as SPEC F1/F6
- Files: packages/core/src/names.ts, packages/core/test/names.test.ts, packages/core/src/index.ts (remove slug)
- Reading list: forge-engineering → typescript, testing
- Acceptance: AC5 unit tests (any case, surrounding spaces, in place among other names, twice → twice); limits and error codes; coverage ≥ 90 %
- Depends on: —
- [x] done (2026-11-06)

### T-02 · Fair shuffle and team split (core)
- Goal: `shuffle` (Fisher–Yates, `crypto.getRandomValues` with rejection sampling — no modulo bias) and `makeTeams`
- Files: packages/core/src/teams.ts, packages/core/test/teams.test.ts
- Reading list: forge-engineering → typescript, testing (fast-check)
- Acceptance: AC1 sizes (10/2 → 5/5, 11/3 → 4/4/3); fast-check: every name exactly once, sizes differ ≤ 1; AC2 fairness 30,000 runs ±2 %; errors per SPEC
- Depends on: T-01
- [x] done (2026-11-06)

### T-03 · Result text format (core)
- Goal: `formatTeams` — old copy format, labels injected (EN/BG), attribution line last
- Files: packages/core/src/format.ts, packages/core/test/format.test.ts
- Reading list: forge-app-shell → app-shell §8 (attribution)
- Acceptance: snapshot tests EN + BG labels; ends with `— Made with TeamSync · <url>`
- Depends on: T-02
- [x] done (2026-11-06)

### T-04 · MCP tool `make_teams`
- Goal: replace `make_slug` with `make_teams` (Zod schema shared with core)
- Files: packages/mcp/src/index.ts, packages/mcp/test/make-teams.test.ts
- Reading list: forge-engineering → mcp
- Acceptance: in-memory client test: valid call → teams; cheat via string input; error codes as `isError`
- Depends on: T-02, T-03
- [x] done (2026-11-06)

### T-05 · Main screen: input and team count (app)
- Goal: textarea with live count, segmented 2–10 (disabled above the name count), Generate button; EN + BG strings
- Files: app/src/teams/view.ts, app/src/teams/state.ts, app/index.html (replace empty state), app/src/styles/app.css, app/src/i18n/en.ts, bg.ts
- Reading list: forge-design → ui-patterns, design-system; forge-app-shell → i18n §2
- Acceptance: keyboard + screen reader usable; thumb-zone button on phones; no string literals; axe 0 serious
- Depends on: T-02
- [x] done (2026-11-06)

### T-06 · Results: cards, Regenerate, Copy, Share (app)
- Goal: team cards + actions; Share via `navigator.share`, fallback copy + toast; `maybeOfferInstall()` after the first result
- Files: app/src/teams/view.ts, app/src/styles/app.css, i18n files
- Reading list: forge-app-shell → app-shell §8; forge-design → ux-principles
- Acceptance: AC1, AC3 in the browser; result announced politely (aria-live); works offline; Regenerate · Copy · Share are an equal-width `.button-stack` (forge-design ui-patterns §1)
- Depends on: T-03, T-05
- [x] done (2026-11-06)

### T-07 · Remember list, Clear, `?teams=`, embed events (app)
- Goal: prefs `names` / `teams` (+ `storage.stores` in app.config), Clear button (instant + Undo toast — forge rule since 2026-11-06: clearing one field is reversible), deep link `?teams=N` (names never in the URL), postMessage `teamsync:ready|result|error`
- Files: app/src/teams/state.ts, app/src/teams/embed.ts, app.config.ts (urlParams, storage)
- Reading list: forge-engineering → browser-storage §1, frontend-level1 §6
- Acceptance: AC4, AC6; Settings → Clear my data removes the list; embed test page receives events
- Depends on: T-06
- [x] done (2026-11-06)

### T-08 · App texts: Help, FAQ, description, legal placeholders (EN + BG)
- Goal: real `help.steps`, `help.features`, 6–8 FAQ, limits (maxItems 1000) in English and `l10n.bg`; fill `content/legal` placeholders
- Files: app.config.ts, content/legal/*.md
- Reading list: forge-app-shell → help-docs, legal-pages, i18n §5; forge-growth → seo-geo
- Acceptance: `pnpm generate` without warnings; llms.txt describes `make_teams`; BG reviewed on screenshots
- Depends on: T-07
- [x] done (2026-11-06)

### T-09 · e2e for app flows + translation review pass
- Goal: Playwright tests for AC1, AC3–AC7 (both languages) next to the template suite; screenshot review of every screen in BG at 390 px and 1280 px
- Files: tests/e2e/teams.spec.ts
- Reading list: forge-engineering → testing §e2e
- Acceptance: whole e2e suite green on 5 projects; axe 0 serious; review fixes applied
- Depends on: T-08
- [x] done (2026-11-06)

### T-10 · Repo, CI and Pages deploy
- Goal: GitHub repo settings (Pages = GitHub Actions, topic `simeonts-microapp`, labels, Dependabot, secret scanning, CodeQL, ruleset) — exact UI steps for Moni; CI green; first deploy
- Files: .github/workflows/ci.yml (as scaffolded), README.md
- Reading list: forge-flow → release
- Acceptance: CI green; https://simeontsvetanov.github.io/teamsync-random-team-generator/ loads and installs; Lighthouse budgets pass
- Depends on: T-09
- [x] done (2026-11-06)

### T-11 · Reviews: security, compliance, UX
- Goal: run agents `security-auditor`, `compliance-reviewer`, `ux-reviewer`; fix findings
- Files: as found
- Reading list: the agents' own files
- Acceptance: no open high/critical findings; licences allowed; Credits complete
- Depends on: T-10
- [ ] done

### T-12 · Release v1.0.0
- Goal: release checklist, CHANGELOG, tag; link from old TeamSync and npm publish stay deferred (Moni)
- Files: CHANGELOG.md, docs/release-checklist.md
- Reading list: forge-flow → release
- Acceptance: checklist all ticked; Moni says "release approved"
- Depends on: T-11
- [ ] done
