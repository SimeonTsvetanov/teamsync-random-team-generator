import { h } from "./dom.ts";
import { setTitleProgress } from "./title.ts";
import { setTaskRunning } from "../state.ts";

/**
 * Determinate progress bar with a text label, announced politely (APP-STANDARD §1 "Progress & states").
 * Also drives the tab title ("45% · App") and blocks update reloads while running.
 */
export function createProgress(label = "Working…"): { el: HTMLElement; update: (done: number, total: number, text?: string) => void; finish: () => void } {
  const bar = h("progress", { max: "100", value: "0" });
  const text = h("p", { class: "progress-text", "aria-live": "polite" }, label);
  const el = h("div", { class: "progress" }, bar, text);
  setTaskRunning(true);
  return {
    el,
    update(done, total, t) {
      const pct = total > 0 ? (done / total) * 100 : 0;
      bar.value = pct;
      text.textContent = t ?? `${String(done)} of ${String(total)}`;
      setTitleProgress(pct);
    },
    finish() {
      bar.value = 100;
      setTaskRunning(false);
      setTitleProgress("done");
    },
  };
}
