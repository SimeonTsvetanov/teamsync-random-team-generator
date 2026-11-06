import { prefs } from "../storage/index.ts";
import { h } from "./dom.ts";
import { openDialog } from "./dialog.ts";
import { showToast } from "./toast.ts";
import { app } from "../config.ts";
import { t } from "../i18n/index.ts";

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: InstallEvent | null = null;
const DAY = 86_400_000;
const isInstalled = (): boolean => matchMedia("(display-mode: standalone)").matches;
const isIOS = (): boolean => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** Captures beforeinstallprompt and keeps the menu item label current. */
export function initInstall(): void {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as InstallEvent; });
  window.addEventListener("appinstalled", () => { deferred = null; updateMenuLabel(); });
  updateMenuLabel();
}

export function updateMenuLabel(): void {
  document.querySelectorAll<HTMLElement>("[data-action=install]").forEach((el) => {
    if (!isInstalled()) return;
    const label = el.querySelector("[data-label]");
    if (label) label.textContent = t("shell.menu.installed");
    el.setAttribute("aria-disabled", "true");
  });
}

/** Menu → Install app (any time) or after the first successful use (once per 30 days). */
export function openInstall(): void {
  if (isInstalled()) return;
  if (deferred) {
    const ev = deferred;
    void ev.prompt().then(() => ev.userChoice).then(() => { deferred = null; updateMenuLabel(); });
    return;
  }
  openDialog("install", t("shell.install.title"), [
    isIOS()
      ? h("ol", {}, h("li", {}, t("shell.install.ios1")), h("li", {}, t("shell.install.ios2")), h("li", {}, t("shell.install.ios3")), h("li", {}, t("shell.install.ios4")))
      : h("p", {}, t("shell.install.other")),
  ]);
}

/**
 * Call after the first successful use. Never covers the result: a gentle toast with an Install
 * button, only where installing is possible (Chromium prompt ready, or iOS Safari), not installed,
 * not in an iframe, at most once per 30 days. (Moni 2026-11-06: the dialog hid TeamSync's teams.)
 */
export function maybeOfferInstall(): void {
  const offered = prefs.get<number>("install-dismissed-at", 0);
  if (isInstalled() || Date.now() - offered < 30 * DAY || window.self !== window.top) return;
  if (!deferred && !isIOS()) return; // nothing the user could do right now
  prefs.set("install-dismissed-at", Date.now());
  showToast({ message: t("shell.install.offer", { name: app.name }), duration: 10_000, action: { label: t("shell.install.action"), run: openInstall } });
}
