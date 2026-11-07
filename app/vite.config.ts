import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
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

/**
 * Makes `vite preview` answer like GitHub Pages: an unknown path gets 404.html with status 404
 * instead of Vite's index.html fallback, so e2e sees production's online behaviour (pwa §4, §9).
 */
function pagesNotFound(): Plugin {
  return {
    name: "forge-pages-404",
    configurePreviewServer(server) {
      const dist = resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
        if (!path.startsWith(BASE)) { next(); return; }
        const file = join(dist, path.slice(BASE.length));
        if (existsSync(file) && (!statSync(file).isDirectory() || existsSync(join(file, "index.html")))) { next(); return; }
        res.statusCode = 404;
        res.setHeader("content-type", "text/html; charset=utf-8");
        res.end(readFileSync(join(dist, "404.html")));
      });
    },
  };
}

export default defineConfig({
  base: BASE,
  build: { target: "es2024" },
  plugins: [
    appHtml(),
    pagesNotFound(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      // No includeAssets: globPatterns below already match every public file worth precaching.
      // injectThemeColor off: index.html has two media theme-color metas (light/dark); a third
      // media-less one would override both (forge-pwa → pwa §2).
      pwaAssets: { config: true, overrideManifestIcons: true, injectThemeColor: false },
      manifest: {
        id: BASE, name: app.name, short_name: app.name, description: app.description,
        lang: app.languages[0] ?? "en", start_url: BASE, scope: BASE, display: "standalone",
        background_color: "#F5F5F7", theme_color: "#F5F5F7", orientation: "any",
        categories: [...app.categories],
        launch_handler: { client_mode: ["navigate-existing", "auto"] },
        ...(screenshots.length ? { screenshots } : {}),
        // Long-press the app icon → jump straight to a task (app.config.shortcuts). Each shortcut
        // needs a 96 px icon (pwa §2); pwa-96x96.png comes from pwa-assets.config.ts.
        ...(app.shortcuts?.length
          ? { shortcuts: app.shortcuts.map((s) => ({ name: s.name, url: s.url, icons: [{ src: "pwa-96x96.png", sizes: "96x96", type: "image/png" }] })) }
          : {}),
        // "Share → app" on Android (app.config.modes.shareTarget; handled in ui/share-target.ts).
        // GET needs the explicit enctype or Chrome reports a manifest warning (pwa §2).
        ...(app.modes.shareTarget
          ? { share_target: { action: `${BASE}?share-target=1`, method: "GET", enctype: "application/x-www-form-urlencoded", params: { title: "title", text: "text", url: "url" } } }
          : {}),
      },
      workbox: {
        cacheId: app.id,
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,wasm,txt,json}"],
        globIgnores: [
          // Inter: precache only latin + cyrillic; other subsets still load on demand (unicode-range).
          "**/inter-{latin-ext,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2",
          // Install-dialog screenshots and the social image are never needed offline (pwa §3).
          "screenshots/**",
          "og-image.png",
        ],
        cleanupOutdatedCaches: true,
        // Any query (?lang=, ?teams=, ?embed=) still matches the precached page.
        ignoreURLParametersMatching: [/.*/],
        // No navigateFallback (vite-plugin-pwa defaults it to index.html): Workbox would answer
        // every non-precached navigation with it, online too (sitemap.xml showed our page).
        navigateFallback: null,
        // Instead: precached pages are served first (the precache route wins); any other
        // navigation goes to the network (GitHub Pages sends its real file or 404) and only when
        // that fails, i.e. offline, our 404 page answers in its offline variant — never the
        // browser's dinosaur (pwa §4, DECISIONS 2026-11-07).
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkOnly",
            options: { precacheFallback: { fallbackURL: `${BASE}404.html` } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
