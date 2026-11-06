import { prefs } from "../storage/index.ts";
import { icon } from "./icons.ts";
import { t } from "../i18n/index.ts";

export type Theme = "system" | "light" | "dark";
const ORDER: readonly Theme[] = ["system", "light", "dark"];
const META = { light: "#F5F5F7", dark: "#000000" } as const;

export const getTheme = (): Theme => {
  const v = prefs.get<string>("theme", "system");
  return v === "light" || v === "dark" ? v : "system";
};

/** Applies Light / Dark / System; `save` remembers it per device (theme-init.js reads the same key). */
export function applyTheme(theme: Theme, save = false): void {
  if (save) {
    if (theme === "system") prefs.remove("theme");
    else prefs.set("theme", theme);
  }
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => { m.content = dark ? META.dark : META.light; });
  const button = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  if (button) {
    button.replaceChildren(icon(theme === "system" ? "monitor" : theme === "light" ? "sun" : "moon"));
    button.setAttribute("aria-label", t("shell.theme.toggle", { theme: t(`shell.theme.${theme}`) }));
  }
}

export function initTheme(): void {
  applyTheme(getTheme());
  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    applyTheme(ORDER[(ORDER.indexOf(getTheme()) + 1) % ORDER.length] ?? "system", true);
  });
}
