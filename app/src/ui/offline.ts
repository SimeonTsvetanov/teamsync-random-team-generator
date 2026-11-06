import { h } from "./dom.ts";
import { icon } from "./icons.ts";
import { t } from "../i18n/index.ts";

/** Small, non-blocking offline pill in the header (APP-STANDARD §1). */
export function initOfflineIndicator(): void {
  const pill = h("span", { class: "offline-pill", role: "status", hidden: "" });
  const label = h("span", { "data-i18n": "shell.offline" }, t("shell.offline"));
  pill.append(icon("offline", 16), " ", label);
  document.querySelector(".header-actions")?.prepend(pill);
  const update = (): void => { pill.hidden = navigator.onLine; };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}
