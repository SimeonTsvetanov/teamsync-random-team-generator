# SPEC — TeamSync

> Status: **draft 2026-11-05** (waiting for Moni's approval) · Phase 0–1 output (forge-flow).
> Rebuild of https://github.com/SimeonTsvetanov/TeamSync (live: /TeamSync/) as a forge micro-app
> in the new repo `teamsync-random-team-generator`. The old repo stays untouched.

## 1. Problem and users
- Problem: split a list of people into fair, random teams quickly — for games, sports, classes, work.
- Users: anyone organising a group (friends' football, teachers, team leads, event hosts), mostly on phones.
- Example: 10 names, 2 teams → two teams of 5, shuffled fairly; copy/share the result to a chat.

## 2. Reuse
- From the old TeamSync: features, texts, the logo (as source for the new icon set), the
  "the followers" cheat. Catalog: no other micro-app does team splitting.

## 3. Features
| ID | Feature | Acceptance |
|---|---|---|
| F1 | Names input: one per line, blank lines and surrounding spaces ignored, duplicates allowed | AC1 |
| F2 | Number of teams 2–10 (stepper/segmented), never more teams than names | AC1, AC4 |
| F3 | **Fair shuffle**: Fisher–Yates with `crypto.getRandomValues` (old `sort(() => 0.5 - Math.random())` is biased); team sizes differ by at most 1 | AC1, AC2 |
| F4 | Result: team cards (Team 1…N, member count, names) with Regenerate, Copy and Share | AC1, AC3 |
| F5 | Copy/Share text keeps the old format + attribution line `— Made with TeamSync · <url>`; Web Share API, fallback copy (no broken Facebook fallback) | AC3 |
| F6 | **Cheat (keep exactly):** a line equal to `the followers` (case-insensitive, trimmed) is replaced in place by: Moni, Iliyana, George, Viki, Eli, Asen, Lubomir, Ralica, Venci, Slavi, Joni, Apapa, Mitaka G, Tonkata, Dinkata, Raiko, Tancheto | AC5 |
| F7 | Remember the last list on this device (prefs tier); "Clear" empties it; Settings → Clear my data removes it | AC6 |
| F8 | English + Bulgarian UI, language switch in Settings, default from the browser language | AC7 |
| F9 | Deep links: `?teams=3` pre-selects the number of teams (names are never put in the URL) | AC4 |
| F10 | Everything from the forge template: Help, Settings/Storage, About, What's new, Install, Report a problem, offline, legal/policy pages, 404, error screen, SEO + llms.txt, local MCP | AC8 |

## 4. Usage modes
- Hosting type: **standard** (GitHub Pages only, everything in the browser).
- Modes: browser · link (`?teams=`) · embed (iframe, events `teamsync:ready|result|error`) · **local MCP**
  (`npx -y @simeonts/teamsync-random-team-generator-mcp`, tool `make_teams`).
- No HTTP API, no n8n block (nothing to process on a server).

## 5. Data and storage
- Stored: theme, language, last names list (string), dismissed prompts → **prefs** tier only.
- Export/import via Settings (JSON). Names are personal data of the user's friends → only local.

## 6. UI
- Level 1 (no framework), forge design (Apple-inspired, light/dark/system), accent from the logo
  (old sky blue `#0ea5e9` fails contrast with white text → a darker shade, checked by `pnpm generate`).
- Main screen: names textarea (with count), teams selector, primary **Generate teams** in the
  thumb zone on phones; results below with Regenerate · Copy · Share.

## 7. Limits and performance
- Up to 1,000 names, 2–10 teams; generation < 50 ms; LCP < 2.5 s, CLS < 0.1, JS < 30 KB gzip (main).

## 8. Legal, privacy, AI
- AI notice Variant A (built with AI, no AI features). No API, no server logs.
- Privacy: names stay in the browser (optionally remembered locally); no cookies, no analytics.
- Contact email: Moni's personal email (confirmed 2026-11-05), rendered by JS only.

## 9. Acceptance criteria
- AC1: 10 names + 2 teams → 2 teams of 5; 11 names + 3 teams → sizes 4/4/3; every name appears exactly once.
- AC2: fairness — over 30,000 runs each name lands in each team with frequency 1/N ± 2 %.
- AC3: Copy produces the team text with attribution; Share opens the native sheet or copies.
- AC4: more teams than names is prevented with a clear message; `?teams=4` pre-selects 4.
- AC5: typing `the followers` (any case) on its own line expands to the 17 names in place.
- AC6: reload keeps the last list; Clear and Clear my data remove it.
- AC7: switching to Bulgarian translates every UI string; the choice is remembered.
- AC8: template e2e suite (15 tests) + new app tests green; offline works; Lighthouse budgets pass.

## 10. Risks
| Risk | Mitigation |
|---|---|
| Template has no i18n yet (EN + BG requested) | add a small i18n module to the forge template (benefits every app), then use it here |
| Old installs point to /TeamSync/ | old repo untouched; later add a "new version" link there (Moni decides) |
| Old logo is a 1.3 MB PNG | use it as source for `/icons` (or redraw as SVG with Moni) |

## 11. Deferred decisions
| Decision | Who/when |
|---|---|
| Accent shade + logo (keep old icon or redraw) | Moni, at `/icons` |
| Link from the old TeamSync to the new app | Moni, at release |
| npm publishing of core + MCP | needs the `simeonts` npm org, at release |
