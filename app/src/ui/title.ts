import { app } from "../config.ts";
import { isTaskRunning } from "../state.ts";

const isStandalone = (): boolean => matchMedia("(display-mode: standalone)").matches;
const isEmbedded = (): boolean => window.self !== window.top || new URLSearchParams(location.search).has("embed");

/** Tab title rotation (APP-STANDARD §9.1): browser tabs only, paused while hidden or busy. */
export function initTitle(): void {
  if (isStandalone() || isEmbedded()) { document.title = app.name; return; }
  if (!app.title.rotate) return;
  let showTagline = false;
  setInterval(() => {
    if (document.hidden || isTaskRunning()) return;
    showTagline = !showTagline;
    document.title = showTagline ? app.tagline : app.name;
  }, 6000);
}

/** While a task runs: "45% · App"; when done in a background tab: "✓ Done · App". */
export function setTitleProgress(percent: number | "done"): void {
  if (percent === "done") document.title = document.hidden ? `✓ Done · ${app.name}` : app.name;
  else document.title = `${String(Math.round(percent))}% · ${app.name}`;
}
