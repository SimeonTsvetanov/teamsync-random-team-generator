# Decisions — TeamSync

Format: `date · decision · reason`. Newest last.

- **2026-11-05 · Scaffolded from the forge template (standard type, Level 1, EN).** · /new-service defaults; change via intake answers.
- **2026-11-05 · New repo `teamsync-random-team-generator` (Moni); display name stays "TeamSync";
  old repo `TeamSync` untouched.** · Availability checked 2026-11-05: GitHub repo not present
  (list_repos), npm `@simeonts/teamsync-random-team-generator-core/-mcp` free, MCP Registry: 0 matches.
- **2026-11-05 · Remember the last names list on the device (prefs tier).** · Moni.
- **2026-11-05 · UI languages: English + Bulgarian.** · Moni. Needs an i18n module in the forge template.
- **2026-11-05 · Contact email: Moni's personal email, rendered by JS only.** · Moni.
- **2026-11-05 · Standard app (no server): modes browser, link, embed, local MCP; no API/n8n.** · Nothing to process server-side.
- **2026-11-05 · Shuffle = Fisher–Yates with crypto.getRandomValues.** · The old `sort(() => 0.5 - Math.random())` is biased.
- **2026-11-05 · Logo: the original TeamSync icon (Moni), vectorized to `app/public/logo.svg` (same shapes, peach #FFBF92); source kept in `design/logo-source.png`.** · One SVG master feeds all icons and the OG image.
- **2026-11-05 · Accent proposed `#B4530F` (logo hue, darkened; 5.02:1 with white).** · The logo peach is 1.60:1 with white and can't be a button color.
- **2026-11-06 · Moni: spec approved (docs/SPEC.md); accent `#B4530F` and the vectorized logo approved.**
- **2026-11-06 · i18n from the forge template 0.3.0 (i18next, typed keys); English is always the
  default, Bulgarian via Settings → Language or `?lang=bg`; Claude writes and reviews the
  Bulgarian texts.** · Moni. Policy pages stay English.
- **2026-11-06 · Forge template 0.4.0 merged: confirm modal for delete/replace/discard, equal-width
  button groups, iOS-style grouped Settings, blurred modal backdrops (Moni's design feedback,
  forge learning L-2026-11-06-01).** · Applies to TeamSync's Clear button and result actions (PLAN T-06, T-07).
- **2026-11-06 · Moni: plan approved (docs/PLAN.md, 12 tasks) → Phase 3 /build starts at T-01.**
- **2026-11-06 · Forge template 0.5.0 merged (offline page, app feel, light dismiss, undo, drafts,
  view transitions, manifest screenshots/shortcuts, optional share target, perf helpers, print).** ·
  Share target stays off until Moni decides (proposed for T-07: share a names list from WhatsApp).
- **2026-11-06 · Moni: WhatsApp sharing "as much as possible".** · In: paste cleanup of chat lists
  (`namesFromSharedText`: numbers, bullets, emoji, "[time] Name:" prefixes, comma lists, shared
  TeamSync results) and Android Share → TeamSync (`modes.shareTarget`). Out: a WhatsApp button
  (`https://wa.me/?text=` — app on phones, WhatsApp Web on computers) next to Copy/Share. Text
  label "WhatsApp" only, no WhatsApp logo (trademark).
- **2026-11-06 · `*.tsbuildinfo` untracked + gitignored.** · A committed buildinfo made CI skip
  building packages/mcp (TS6305 on a clean runner); forge template .gitignore fixed too.
- **2026-11-06 · CSP without `upgrade-insecure-requests`; Zod `jitless` in the browser.** · CI on
  WebKit: the directive upgraded `http://localhost` and nothing loaded (57 e2e failures); Pages
  already forces HTTPS. Firefox logged a CSP eval violation from Zod's JIT. Both fixed in the forge too.
- **2026-11-06 · Moni's design round 2:** one Share button (native sheet; WhatsApp + Copy only as
  fallback), phone = app (tool fills the screen, results are the next screen with "‹ Names",
  steps/FAQ/footer only in Help/menu on phones), mint accent `#3DDC97` with dark text, quiet red
  "Clear my data", launch splash with the tagline (once per session), Apple-like motion, toasts
  from the top on phones, Keti added to the followers after Dinkata. All generic parts are in the
  forge template 0.6.0.
- **2026-11-06 · T-11 reviews.** Security: ship (0 Critical/High); fixed both Medium (licence
  gate now `pnpm -r`, hardened import: 50 MB cap, ZIP magic bytes, zip-bomb limits, typed pref
  checks) and the Lows (deploy only after CI, job timeouts, JSON-LD `<` escape, `Object.hasOwn`).
  Compliance: no AI system → Art. 50 n/a (sources: ai-act-service-desk.ec.europa.eu Art. 3/50/113,
  Commission Art. 50 FAQ, accessed 2026-11-06); fixed both Medium (no email field while reports go
  through GitHub; "never in TeamSync links" + sharing bullet) and the Lows (full stored-data list,
  third-party names note, no "API" in Terms, Dexie NOTICE in Credits, LICENSE in npm packages,
  logo marked AI-assisted). Dev-only tools under MPL-2.0/LGPL-3.0/BlueOak/CC-BY (axe-core,
  lightningcss, sharp-libvips, glob, caniuse-lite) are exempt: never shipped to users. Lawyer
  questions (BG consumer law on "as is", Terms §8 acceptance, Legal notice address) recorded, not blocking.
- **2026-11-06 · UX review fixes:** equal-width report buttons, static pages (404, policies) use
  the app accent, menu headings 4.5:1, phone header = logo + name + menu (Share app/theme in the
  menu), compact Share sheet, menu safe-area padding, 44 px touch targets, result bar fades the
  list instead of covering it, wider list numbers, shorter BG hint. Alert "Delete" stays solid red
  (red text on the dark alert surface would be 4.09:1).
- **2026-11-06 · Moni: LinkedIn (https://www.linkedin.com/in/simeon-tsvetanov-a00963159) in
  About, menu (Support group), Support page, Legal notice and JSON-LD `sameAs`** — from
  `app.config.author.linkedin` (forge template 0.6.5).
- **2026-11-06 · Moni: "Clear and start over" as the last, quiet button on the results screen —
  asks first, then empties names + teams and returns to the first screen.** · Explicit wish for a
  confirmation here (not Undo). Hover on quiet red buttons/links no longer fades or fills (axe:
  3.18–3.72:1); they keep full contrast.
- **2026-11-06 · Moni: no visible "Your teams" title (results start level with the names card);
  "More free tools" → GitHub list of simeonts-microapp repos (hub site simeontsvetanov.github.io
  does not exist yet → was 404); About: "GitHub" = Moni's profile, the app's code is "Source code".**
- **2026-11-06 · Forge 0.8.1 merged: code-quality + CSS-architecture rules applied.** Moni asked for
  "clear, super-professional rules" in the plugin first, then TeamSync. `teams/view.ts` (207 lines)
  split by meaning (screen, form, names-input, results, result-actions, view); TSDoc on every export
  in teams/core/mcp; `teams.css` → `components/teams-{workspace,form,stepper,generate,results}.css`
  + `teams-overrides.css` (print/forced-colors must be in `@layer overrides`, else a more specific
  component rule wins). Reviewer: no correctness/security findings; template-level findings fixed
  in forge 0.8.1. Kept for later: rename the `has-results` state class to `data-state`; result
  buttons are required screen elements (always in index.html, covered by e2e). Behaviour and
  rendering unchanged (130 computed-style dumps identical).
- **2026-11-07 · Forge 0.10.0 SEO merged.** One English URL (hreflang and `?lang=` alternates
  removed — Moni 2026-11-06), full Open Graph/X tags, `rel=describedby` llms.txt in spec format,
  JSON-LD as entity data (no ratings), sitemap lastmod from policy "Last updated" dates (app URL gets
  one at the first CHANGELOG release), FAQ visible on phones collapsed in `<details>`. verify green
  (63 unit), e2e 76/76 chromium+mobile. Live `seo-check` after deploy; host-root items wait for the hub repo.
- **2026-11-07 · Forge 0.12.0 PWA merged.** Fixes the live bug where the service worker showed
  "This page doesn't exist" for non-saved addresses while online (e.g. sitemap.xml): now online
  goes to the network, our page only when offline (Moni approved). Safe multi-tab updates, hourly
  update check, reload-once after a deploy removes old chunks, lighter precache, shortcut icons.
  verify green (82 unit), e2e 82/82 chromium+mobile.
