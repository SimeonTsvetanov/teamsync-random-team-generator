// Single import point for the app config inside app/. Widens the `as const` literal types so
// optional fields (null today) type-check when they are enabled later.
import { app as config, type AppConfig, type AppText } from "../../app.config.ts";

export type { AppText };
export const app: AppConfig = config;

/** User-facing app texts in a language; English (the config itself) is the fallback. */
export function appText(lang: AppConfig["languages"][number]): AppText {
  const en: AppText = { tagline: app.tagline, description: app.description, help: app.help, faq: app.faq };
  return lang === "en" ? en : (app.l10n?.[lang] ?? en);
}
