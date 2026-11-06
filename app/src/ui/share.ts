import { app } from "../config.ts";
import { showToast } from "./toast.ts";
import { t, text } from "../i18n/index.ts";
import { h } from "./dom.ts";
import { icon } from "./icons.ts";
import { openDialog } from "./dialog.ts";

const copy = (value: string): void => {
  navigator.clipboard.writeText(value).then(
    () => { showToast({ message: t("shell.copied") }); },
    () => { showToast({ message: value, persistent: true }); },
  );
};

/**
 * ONE Share button for everything (forge-app-shell → app-shell §8): the device's own share sheet
 * (WhatsApp, Viber, Messages … are in it). Where there is none (most desktops) or it fails, a
 * small sheet offers WhatsApp (wa.me) + Copy. Cancelling the native sheet is silent.
 */
export async function shareText(message: string, title = app.name): Promise<void> {
  const fallback = (): void => {
    const wa = h("a", { class: "button button--primary", href: `https://wa.me/?text=${encodeURIComponent(message)}`, target: "_blank", rel: "noopener" }, icon("message"), "WhatsApp");
    const cp = h("button", { class: "button", type: "button" }, icon("copy"), t("shell.copy"));
    cp.addEventListener("click", () => { copy(message); });
    openDialog("share", t("shell.shareTitle"), [h("div", { class: "button-stack" }, wa, cp)], { compact: true });
  };
  if (typeof navigator.share !== "function") { fallback(); return; }
  try {
    await navigator.share({ title, text: message });
  } catch (e) {
    if (!(e instanceof DOMException && e.name === "AbortError")) fallback();
  }
}

/** Share app (header + menu): tagline + link through the same single Share flow. */
export async function shareApp(): Promise<void> {
  await shareText(`${text().tagline} — ${app.url}`);
}
