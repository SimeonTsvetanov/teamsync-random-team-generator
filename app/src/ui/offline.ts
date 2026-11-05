import { h } from "./dom.ts";
import { icon } from "./icons.ts";

/** Small, non-blocking offline pill in the header (APP-STANDARD §1). */
export function initOfflineIndicator(): void {
  const pill = h("span", { class: "offline-pill", role: "status", hidden: "" });
  pill.append(icon("offline", 16), " Offline — still works");
  document.querySelector(".header-actions")?.prepend(pill);
  const update = (): void => { pill.hidden = navigator.onLine; };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}
