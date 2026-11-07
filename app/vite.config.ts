import { existsSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { app as config, type AppConfig } from "../app.config.ts";
import { OG_IMAGE, escapeHtml, ogImageAlt, ogImageUrl, siteVerificationTag, structuredData } from "../scripts/seo.ts";

const app: AppConfig = config;

const BASE = `/${app.id}/`;

// Manifest screenshots for the richer install dialog (Chrome/Edge) — made by `pnpm screenshots`
// (tests/screenshots) before a release and committed; skipped until they exist.
const shot = (file: string, sizes: string, formFactor: "narrow" | "wide", label: string) =>
  existsSync(new URL(`./public/screenshots/${file}`, import.meta.url)) ? [{ src: `screenshots/${file}`, sizes, type: "image/png", form_factor: formFactor, label }] : [];
const screenshots = [
  ...shot("narrow.png", "780x1688", "narrow", `${app.name} on a phone`),
  ...shot("wide.png", "1280x800", "wide", `${app.name} on a computer`),
];

/** Fills %APP_*% placeholders, the head tags and the JSON-LD block in index.html from app.config.ts (seo-geo §2–§5). */
function appHtml(): Plugin {
  const verification = siteVerificationTag(app);
  const origin = (u: string | null | undefined): string => (u ? new URL(u).origin : "");
  const connect = ["'self'", origin(app.feedback.webhook), origin(app.modes.api?.baseUrl)].filter(Boolean).join(" ");
  // One English URL per app: no hreflang or ?lang= alternates (DECISIONS 2026-11-06); other UI
  // languages are client-side translations only.
  return {
    name: "forge-app-html",
    transformIndexHtml(html, ctx) {
      // Vite's dev server injects inline <style> tags; allow them ONLY in dev. Production keeps style-src 'self'.
      const dev = ctx.server !== undefined;
      // Replacer functions everywhere config text goes in: "$&", "$'" in a string would be expanded.
      return html
        .replace("style-src 'self'", dev ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'")
        .replaceAll("%APP_NAME%", () => escapeHtml(app.name))
        .replaceAll("%APP_TAGLINE%", () => escapeHtml(app.tagline))
        .replaceAll("%APP_DESCRIPTION%", () => escapeHtml(app.description))
        .replaceAll("%APP_URL%", () => app.url)
        .replaceAll("%APP_OG_IMAGE_ALT%", () => escapeHtml(ogImageAlt(app)))
        .replaceAll("%OG_IMAGE_WIDTH%", () => String(OG_IMAGE.width))
        .replaceAll("%OG_IMAGE_HEIGHT%", () => String(OG_IMAGE.height))
        .replaceAll("%OG_IMAGE_TYPE%", () => OG_IMAGE.type)
        .replaceAll("%OG_IMAGE_URL%", () => ogImageUrl(app))
        .replace(/^ *%APP_SITE_VERIFICATION%\n/m, () => verification ? `    ${verification}\n` : "") // no empty line when unset
        .replaceAll("%APP_MORE_TOOLS%", () => app.moreTools.replaceAll("&", "&amp;"))
        .replaceAll("%APP_LANG%", () => app.languages[0] ?? "en")
        .replaceAll("%BUILD_YEAR%", () => String(new Date().getFullYear()))
        .replace("%APP_JSONLD%", () => JSON.stringify(structuredData(app)).replace(/</g, "\\u003c")) // never "</script>" inside the block
        .replace("connect-src 'self'", () => `connect-src ${connect}`)
        .replace("%APP_STEPS%", () => app.help.steps.map((t) => `<li>${escapeHtml(t)}</li>`).join(""))
        .replace("%APP_FAQ%", () => app.faq.map((f) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join(""));
    },
  };
}

export default defineConfig({
  base: BASE,
  build: { target: "es2024" },
  plugins: [
    appHtml(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["logo.svg", "robots.txt", "llms.txt", "llms-full.txt", "og-image.png"],
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        id: BASE, name: app.name, short_name: app.name, description: app.description,
        lang: app.languages[0] ?? "en", start_url: BASE, scope: BASE, display: "standalone",
        background_color: "#F5F5F7", theme_color: "#F5F5F7", orientation: "any",
        categories: [...app.categories],
        launch_handler: { client_mode: ["navigate-existing", "auto"] },
        ...(screenshots.length ? { screenshots } : {}),
        // Long-press the app icon → jump straight to a task (app.config.shortcuts).
        ...(app.shortcuts?.length ? { shortcuts: app.shortcuts.map((s) => ({ name: s.name, url: s.url })) } : {}),
        // "Share → app" on Android (app.config.modes.shareTarget; handled in ui/share-target.ts).
        ...(app.modes.shareTarget
          ? { share_target: { action: `${BASE}?share-target=1`, method: "GET", params: { title: "title", text: "text", url: "url" } } }
          : {}),
      },
      workbox: {
        cacheId: app.id,
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,wasm,txt,json}"],
        // Inter: precache only latin + cyrillic; other subsets still load on demand (unicode-range).
        globIgnores: ["**/inter-{latin-ext,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2"],
        cleanupOutdatedCaches: true,
        // Any query (?lang=, ?teams=, ?embed=) still matches the precached page.
        ignoreURLParametersMatching: [/.*/],
        // Offline + an address that isn't precached → our 404 page in its offline variant,
        // never the browser's dinosaur (web.dev PWA checklist). Precached pages are served first.
        navigateFallback: `${BASE}404.html`,
        navigateFallbackAllowlist: [new RegExp(`^${BASE}`)],
      },
      devOptions: { enabled: false },
    }),
  ],
});
