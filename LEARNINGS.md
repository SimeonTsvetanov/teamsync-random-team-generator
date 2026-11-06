# LEARNINGS — TeamSync

Corrections captured for `/learn` (format: forge-flow → learn §1). Newest last.

## L-2026-11-06-01 · design · applied in forge 0.4.0
- **What happened:** Moni reviewed Settings on a phone: buttons of different widths looked ragged;
  "Clear my data" used the browser's confirm box; he wants every delete/discard confirmed in a
  modal with the page blurred behind; the overall look should be more polished.
- **Fix (forge):** `confirmAction()` alert, dialog `beforeClose` guard, `.button-stack`, grouped
  Settings, `--backdrop-blur`, dark fill fix; rules in forge-design ui-patterns §1/§4/§12 and
  moni-taste; eval `design-confirm-destructive` 0.83 → 1.00. Central log: forge `docs/LEARNINGS-LOG.md`.
