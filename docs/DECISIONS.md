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
