/**
 * i18n (forge-app-shell → i18n): i18next with typed keys. English is the default and the
 * fallback; other languages come only from app.config `languages` (generated/locales.ts).
 * Choice order: `?lang=xx` (this visit) → saved pref "lang" → "en". No browser auto-detect
 * (Moni's decision 2026-11-05). Static HTML carries English (SEO, no-JS) and is translated
 * via `data-i18n` / `data-i18n-aria-label` attributes.
 */
import i18next from "i18next";
import { app, appText, type AppText } from "../config.ts";
import { resources } from "../generated/locales.ts";
import { prefs } from "../storage/index.ts";
import type { en } from "./en.ts";

/** Deep "string" version of the English dictionary — the type every other language must satisfy. */
type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Messages = Widen<typeof en>;
export type Lang = AppConfigLang;
type AppConfigLang = (typeof app.languages)[number];

declare module "i18next" {
  interface CustomTypeOptions {
    resources: { translation: typeof en };
  }
}

/** Native names — never translated (a user must find their own language). */
export const LANG_NAMES: Record<Lang, string> = { en: "English", bg: "Български" };

const supported = (v: string | null | undefined): v is Lang => !!v && (app.languages as readonly string[]).includes(v);

function pick(): Lang {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (supported(fromUrl)) return fromUrl;
  const saved = prefs.get<string | null>("lang", null);
  return supported(saved) ? saved : "en";
}

/** Synchronous (all bundles are in the build) so even the error screen is translated. */
export function initI18n(): void {
  const lng = pick();
  void i18next.init({
    lng,
    fallbackLng: "en",
    supportedLngs: [...app.languages],
    resources: Object.fromEntries(Object.entries(resources).map(([k, v]) => [k, { translation: v }])),
    interpolation: { escapeValue: false }, // the DOM is built with textContent only — never innerHTML
    initAsync: false,
  });
  applyStatic();
}

export const t = i18next.t.bind(i18next);
export const getLanguage = (): Lang => (supported(i18next.language) ? i18next.language : "en");
/** App texts from app.config (tagline, help, FAQ …) in the current language. */
export const text = (): AppText => appText(getLanguage());

/** Switches language, remembers it, re-translates static HTML and notifies the app (`i18n:change`). */
export function setLanguage(lang: Lang): void {
  if (lang === "en") prefs.remove("lang");
  else prefs.set("lang", lang);
  void i18next.changeLanguage(lang);
  applyStatic();
  document.dispatchEvent(new CustomEvent("i18n:change", { detail: lang }));
}

/** Translates the static shell: `data-i18n="key"` (text) and `data-i18n-aria-label="key"`. */
export function applyStatic(root: ParentNode = document): void {
  document.documentElement.lang = getLanguage();
  const vars = { name: app.name };
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset["i18n"] as never, vars);
  });
  root.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset["i18nAriaLabel"] as never, vars));
  });
  // App texts from app.config (hero, steps, FAQ) — rendered from data, textContent only.
  const at = text();
  root.querySelectorAll<HTMLElement>("[data-text=tagline]").forEach((el) => { el.textContent = at.tagline; });
  root.querySelectorAll<HTMLElement>("[data-text=description]").forEach((el) => { el.textContent = at.description; });
  root.querySelectorAll<HTMLElement>("[data-text=steps]").forEach((el) => {
    el.replaceChildren(...at.help.steps.map((s) => Object.assign(document.createElement("li"), { textContent: s })));
  });
  root.querySelectorAll<HTMLElement>("[data-text=faq]").forEach((el) => {
    el.replaceChildren(...at.faq.map((f) => {
      const d = document.createElement("details");
      d.append(Object.assign(document.createElement("summary"), { textContent: f.q }), Object.assign(document.createElement("p"), { textContent: f.a }));
      return d;
    }));
  });
}
