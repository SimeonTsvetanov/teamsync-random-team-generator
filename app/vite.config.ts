import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { app as config, type AppConfig } from "../app.config.ts";

const app: AppConfig = config;

const BASE = `/${app.id}/`;

/** Fills %APP_*% placeholders and the JSON-LD block in index.html from app.config.ts. */
function appHtml(): Plugin {
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: app.name, url: app.url,
      description: app.description, applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any — runs in the browser", offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      author: { "@type": "Person", name: "Simeon Tsvetanov", url: "https://github.com/SimeonTsvetanov" },
      softwareVersion: app.version, sameAs: [app.repo],
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: app.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
  const esc = (t: string): string => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const origin = (u: string | null | undefined): string => (u ? new URL(u).origin : "");
  const connect = ["'self'", origin(app.feedback.webhook), origin(app.modes.api?.baseUrl)].filter(Boolean).join(" ");
  // Multilingual apps: hreflang alternates (?lang=xx) + x-default (forge-app-shell → i18n §4).
  const hreflang = app.languages.length > 1
    ? [...app.languages.map((l) => `<link rel="alternate" hreflang="${l}" href="${app.url}${l === "en" ? "" : `?lang=${l}`}" />`),
      `<link rel="alternate" hreflang="x-default" href="${app.url}" />`].join("\n    ")
    : "";
  return {
    name: "forge-app-html",
    transformIndexHtml(html, ctx) {
      // Vite's dev server injects inline <style> tags; allow them ONLY in dev. Production keeps style-src 'self'.
      const dev = ctx.server !== undefined;
      return html
        .replace("style-src 'self'", dev ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'")
        .replaceAll("%APP_NAME%", app.name)
        .replaceAll("%APP_TAGLINE%", app.tagline)
        .replaceAll("%APP_DESCRIPTION%", app.description)
        .replaceAll("%APP_URL%", app.url)
        .replaceAll("%APP_LANG%", app.languages[0] ?? "en")
        .replaceAll("%BUILD_YEAR%", String(new Date().getFullYear()))
        .replace("%APP_JSONLD%", JSON.stringify(jsonLd))
        .replace("connect-src 'self'", `connect-src ${connect}`)
        .replace("%APP_HREFLANG%", hreflang)
        .replace("%APP_STEPS%", app.help.steps.map((t) => `<li>${esc(t)}</li>`).join(""))
        .replace("%APP_FAQ%", app.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join(""));
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
      },
      workbox: {
        cacheId: app.id,
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,wasm,txt,json}"],
        // Inter: precache only latin + cyrillic; other subsets still load on demand (unicode-range).
        globIgnores: ["**/inter-{latin-ext,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2"],
        cleanupOutdatedCaches: true,
        navigateFallback: `${BASE}index.html`,
        navigateFallbackAllowlist: [new RegExp(`^${BASE}$`)],
      },
      devOptions: { enabled: false },
    }),
  ],
});
