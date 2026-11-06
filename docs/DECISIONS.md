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
