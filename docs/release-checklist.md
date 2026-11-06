<!-- Release checklist — verbatim from APP-STANDARD §16 (2026-11-05). Copy into each release PR. Tick each item WITH evidence. -->

# Release checklist — v1.0.0 (TeamSync)

- [ ] `app.config.ts` complete; generated files rebuilt (llms.txt, JSON-LD, manifest, sitemap).
- [ ] Menu items, Help tabs and Copy buttons work for every mode the app has.
- [ ] Terms, Privacy and AI notice match what the app actually does (layers, AI, logs).
- [ ] Contact email confirmed with Moni.
- [ ] Licence check passes (§4.1); Credits and NOTICE complete; `docs/ASSETS.md` current.
- [ ] If AI is involved: official EU AI Act sources re-read and recorded; `/compliance` report clean.
- [ ] Share app + Share/Copy results work (with attribution line); Install item and prompt work
      (Chromium + iOS instructions).
- [ ] All icons/images from `/icons` present and referenced; maskable safe zone OK.
- [ ] CSP meta present and the app works with it (no console CSP errors).
- [ ] Lighthouse: PWA installable; Performance / A11y / Best Practices / SEO green.
- [ ] axe: no serious accessibility violations.
- [ ] Offline works; update toast appears after redeploy.
- [ ] robots.txt allows AI crawlers; llms.txt, llms-full.txt, openapi.json current.
- [ ] Agent test passed: an AI agent given only the URL used the app correctly.
- [ ] Help covers every category that applies; Copy n8n nodes pastes a working block.
- [ ] Storage: everything namespaced by app id; Clear my data removes only this app's data;
      Export/Import work; quota errors handled; Terms + Privacy describe what is stored.
- [ ] Tab title `{App} — {tagline}`; rotation works in tabs only (not standalone/embed).
- [ ] Supply-chain settings present; Dependabot, secret scanning, CodeQL on; Actions pinned.
- [ ] §14 test gates all green; `/security-audit` has no Critical/High findings.
- [ ] Ads: off, or enabled with CMP, ads.txt, updated Privacy and recorded decision.
- [ ] `/list-app` run: MCP Registry entry and listings current.
- [ ] §15.1 items 1–9 present: sample/empty state, offline page, drag/drop/paste, permission
      context, deep links, manifest extras, security.txt valid (not expiring), error report flow,
      uptime monitor active (if API).
- [ ] Report a problem: in-app send creates an issue + notification; GitHub link opens the template.
- [ ] © year is computed at runtime (no hard-coded year anywhere).
- [ ] Screenshots pass the §13 responsive matrix; real iPhone standalone check passed (§12.1).
- [ ] Verified on the live Pages URL.
- [ ] Standalone policy pages live (terms/, privacy/, ai-notice/, legal-notice/, support/) and the custom 404 + error screen work (forge 2026-11-05).
- [ ] `pnpm screenshots` re-run if the main screen changed; manifest screenshots + shortcuts present (forge 2026-11-06).
- [ ] Offline: unknown address shows our offline page; `?query` links open the saved app (e2e).
- [ ] Confirm/undo/draft rules hold (`app-rules` unit test green; ux-reviewer pass).
- [ ] Performance chapter checklist (forge-engineering → performance §5); LCP/INP/CLS budgets green.
- [ ] On Moni's machine (if installed): `security-guidance` clean, `pr-review-toolkit` review done.
