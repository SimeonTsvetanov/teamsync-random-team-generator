/**
 * Generates everything user-facing from app.config.ts (APP-STANDARD §0). Run: `pnpm generate`
 * (also runs before dev/build). Writes into app/public/: robots.txt, sitemap.xml, llms.txt,
 * 404.html + error-page assets, tokens.css, standalone policy pages from content/legal/*.md,
 * and LICENSE (current year) at the repo root. Never hand-edit the outputs.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import sharp from "sharp";
import { app as config, type AppConfig } from "../app.config.ts";

// Widen the `as const` literal types so optional modes (null today) type-check when enabled.
const app: AppConfig = config;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "app", "public");
const assets = join(root, "scripts", "page-assets");
const base = `/${app.id}/`;
const year = String(new Date().getFullYear());
const today = new Date().toISOString().slice(0, 10);
const write = (rel: string, text: string): void => {
  const path = join(pub, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};
const fill = (text: string): string =>
  text
    .replace(/<!--[\s\S]*?-->\s*/g, "") // internal template notes never ship
    .replaceAll("APP_BASE/", `${app.id}/`)
    .replaceAll("APP_NAME", app.name)
    .replaceAll("APP_REPO", app.id)
    .replaceAll("APP_LANG", app.languages[0] ?? "en")
    .replaceAll("APP_URL", app.url)
    .replaceAll("APP_ID", app.id)
    .replaceAll("BUILD_YEAR", year);

// robots.txt — AI crawlers welcome (forge-growth).
write("robots.txt", readFileSync(join(assets, "robots.txt"), "utf8").replaceAll("<app-id>", app.id));

// sitemap.xml — app + policy pages.
const pages = ["", "terms/", "privacy/", "ai-notice/", "legal-notice/", "support/"];
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((p) => `  <url><loc>${app.url}${p}</loc><lastmod>${today}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`,
);

// llms.txt — agent docs (forge-growth seo-geo §5).
const modes = [
  `- Browser: ${app.url} (installable PWA, works offline after first visit)`,
  app.modes.mcp ? `- MCP (local): npx -y ${app.modes.mcp.npm}` : "",
  app.modes.mcp?.url ? `- MCP (remote): ${app.modes.mcp.url}` : "",
  app.modes.api ? `- HTTP API: ${app.modes.api.baseUrl} (OpenAPI: ${app.modes.api.openapi})` : "",
].filter(Boolean);
write(
  "llms.txt",
  [
    `# ${app.name}`, "", `> ${app.tagline}`, "", app.description, "", "## Use it", ...modes, "",
    "## FAQ", ...app.faq.map((f) => `- ${f.q} ${f.a}`), "",
    "## About", `- Licence: MIT · Source: ${app.repo} · Author: Simeon Tsvetanov`,
    `- Policies: ${app.url}terms/ · ${app.url}privacy/ · ${app.url}ai-notice/`, "",
  ].join("\n"),
);

// Error page + shared page assets (forge-app-shell error-pages / pages).
write("404.html", fill(readFileSync(join(assets, "404.html"), "utf8")));
for (const f of ["error-page.css", "error-page.js", "page.css", "year.js"]) {
  copyFileSync(join(assets, f), join(pub, f));
}
copyFileSync(join(root, "design", "tokens.css"), join(pub, "tokens.css"));

// Standalone policy pages from content/legal/*.md (same text as the in-app dialogs).
const shell = readFileSync(join(assets, "page.html"), "utf8");
const legalDir = join(root, "content", "legal");
const titles: Record<string, string> = {
  terms: "Terms & Conditions", privacy: "Privacy", "ai-notice": "AI notice", "legal-notice": "Legal notice", support: "Support",
};
const replacements: Record<string, string> = {
  "{App}": app.name, "{app url}": app.url, "{repo}": app.repo, "{base}": base, "{country}": app.author.country,
  "{linkedin}": app.author.linkedin ?? "https://www.linkedin.com/",
  // Email is rendered by year.js from data attributes, never as plain text in HTML (anti-scraping).
  "{email}": `<a data-email-user="${app.contact.email.split("@")[0] ?? ""}" data-email-domain="${app.contact.email.split("@")[1] ?? ""}">email (needs JavaScript)</a>`,
};
let unfilled = 0;
for (const file of readdirSync(legalDir).filter((f) => f.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "");
  const title = titles[slug];
  if (!title) continue; // optional pages live in content/legal/optional until enabled
  let md = readFileSync(join(legalDir, file), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  for (const [k, v] of Object.entries(replacements)) md = md.replaceAll(k, v);
  unfilled += (md.match(/\{[^}\n]{2,60}\}/g) ?? []).length;
  const html = shell
    .replace('<article class="page-body">PAGE_BODY</article>', `<article class="page-body">${await marked.parse(md)}</article>`)
    .replaceAll("PAGE_TITLE", title)
    .replaceAll("PAGE_DESCRIPTION", `${title} for ${app.name}.`)
    .replaceAll("PAGE_SLUG", slug);
  write(join(slug, "index.html"), fill(html));
}

// llms-full.txt — complete reference for agents (APP-STANDARD §10).
const m = app.modes;
write(
  "llms-full.txt",
  [
    `# ${app.name} — full reference`, "", `> ${app.tagline}`, "", app.description, "",
    "## Usage modes", ...modes, "",
    "## URL params", ...(m.urlParams.length ? m.urlParams.map((u) => `- ${u.name} = ${u.values} (default ${u.default}) — ${u.meaning}`) : ["- none"]), "",
    "## Embed (iframe + postMessage)",
    m.postMessage ? `- <iframe src="${app.url}?embed=1"> · events: ${["ready", "progress", "result", "error"].map((e) => `${m.postMessage?.prefix ?? ""}:${e}`).join(", ")}` : "- not available", "",
    "## HTTP API", m.api ? `- Base: ${m.api.baseUrl} · OpenAPI: ${m.api.baseUrl}/${m.api.openapi} · errors: {"error":{"code","message","requestId"}} · 429 = rate limited` : "- not available (browser-only app)", "",
    "## MCP", m.mcp ? `- Local: npx -y ${m.mcp.npm}${m.mcp.url ? `\n- Remote: ${m.mcp.url}` : ""}` : "- not available", "",
    "## Limits", `- Max file size: ${app.limits.maxFileMB ? `${String(app.limits.maxFileMB)} MB` : "n/a"} · Max items: ${app.limits.maxItems ? String(app.limits.maxItems) : "n/a"}`, "",
    "## How to use (steps)", ...app.help.steps.map((t, i) => `${String(i + 1)}. ${t}`), "",
    "## FAQ", ...app.faq.map((f) => `### ${f.q}\n${f.a}`), "",
    "## Privacy", "- Browser mode: files never leave the device. No accounts, cookies, tracking or analytics.", "",
    "## About", `- Licence: MIT · Source: ${app.repo} · Author: ${app.author.name} · Support: ${app.support.buyMeACoffee}`, "",
  ].join("\n"),
);

// What's new + Credits data for the app (generated, never hand-edited).
const gen = join(root, "app", "src", "generated");
mkdirSync(gen, { recursive: true });
const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8")
  .split(/^## /m).slice(1)
  .map((block) => {
    const [head = "", ...lines] = block.split("\n");
    const version = /\[([^\]]+)\]/.exec(head)?.[1] ?? head.trim();
    const date = /(\d{4}-\d{2}-\d{2})/.exec(head)?.[1] ?? "";
    return { version, date, items: lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim()) };
  })
  .filter((v) => v.items.length)
  .slice(0, 3);
writeFileSync(join(gen, "changelog.json"), JSON.stringify(changelog, null, 2) + "\n");
const depNames = new Set<string>();
for (const pkg of ["app", "packages/core", "packages/mcp"]) {
  const pj = JSON.parse(readFileSync(join(root, pkg, "package.json"), "utf8")) as { dependencies?: Record<string, string> };
  for (const d of Object.keys(pj.dependencies ?? {})) if (!d.startsWith("@simeonts/")) depNames.add(d);
}
const credits = [...depNames].sort().map((name) => {
  for (const pkg of ["app", "packages/core", "packages/mcp", "."]) {
    const f = join(root, pkg, "node_modules", name, "package.json");
    if (existsSync(f)) {
      const license = (JSON.parse(readFileSync(f, "utf8")) as { license?: string }).license ?? "see package";
      // Apache-2.0 §4(d): a NOTICE file shipped by the dependency must be reproduced (About → Credits).
      const noticeFile = ["NOTICE", "NOTICE.md", "NOTICE.txt"].map((n) => join(dirname(f), n)).find((n) => existsSync(n));
      return noticeFile ? { name, license, notice: readFileSync(noticeFile, "utf8").trim().slice(0, 2000) } : { name, license };
    }
  }
  return { name, license: "see package" };
});
writeFileSync(join(gen, "credits.json"), JSON.stringify(credits, null, 2) + "\n");

// og-image.png 1200×630 (logo + name + tagline on the light background).
const esc = (t: string): string => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const logo = readFileSync(join(pub, "logo.svg"), "utf8").replace(/<svg[^>]*>/, "").replace("</svg>", "");
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#F5F5F7"/>
<g transform="translate(96 150) scale(2.5)">${logo}</g>
<text x="96" y="420" font-family="Inter, Helvetica, Arial, sans-serif" font-size="76" font-weight="700" fill="#1D1D1F">${esc(app.name)}</text>
<text x="96" y="500" font-family="Inter, Helvetica, Arial, sans-serif" font-size="40" fill="#6E6E73">${esc(app.tagline)}</text>
</svg>`;
await sharp(Buffer.from(ogSvg)).png().toFile(join(pub, "og-image.png"));

// README: generated "For AI agents" + usage section between markers (no drift).
const readmePath = join(root, "README.md");
const readme = readFileSync(readmePath, "utf8");
const usage = [
  "<!-- forge:usage:start -->",
  `- **Browser:** ${app.url}`,
  ...(m.mcp ? [`- **MCP (local):** \`npx -y ${m.mcp.npm}\``] : []),
  ...(m.api ? [`- **HTTP API:** ${m.api.baseUrl} — [OpenAPI](${m.api.baseUrl}/${m.api.openapi})`] : []),
  `- **For AI agents:** [llms.txt](${app.url}llms.txt) · [llms-full.txt](${app.url}llms-full.txt)`,
  "<!-- forge:usage:end -->",
].join("\n");
if (readme.includes("<!-- forge:usage:start -->")) {
  writeFileSync(readmePath, readme.replace(/<!-- forge:usage:start -->[\s\S]*?<!-- forge:usage:end -->/, usage));
}

// n8n block (hosted apps): app/src/n8n-workflow.json → public, read by Help → "Copy n8n nodes".
const n8nBlock = join(root, "app", "src", "n8n-workflow.json");
if (app.modes.n8n && existsSync(n8nBlock)) copyFileSync(n8nBlock, join(pub, "n8n-workflow.json"));

// Accent (forge-design → design-system §3): derive the full accent set from app.config.accent and
// refuse a color that fails WCAG AA with white text. Empty file = default Apple-style blue.
{
  const lin = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const delin = (c: number): number => Math.min(1, Math.max(0, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
  const toOklch = (hex: string): [number, number, number] => {
    const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255)) as [number, number, number];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m2 = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s2 = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m2 - 0.0040720468 * s2;
    const A = 1.9779984951 * l - 2.428592205 * m2 + 0.4505937099 * s2;
    const B = 0.0259040371 * l + 0.7827717662 * m2 - 0.808675766 * s2;
    return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
  };
  const toRgb = ([L, C, H]: [number, number, number]): [number, number, number] => {
    const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, ss = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [delin(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss), delin(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss), delin(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss)];
  };
  const lum = (rgb: [number, number, number]): number => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  const contrast = (x: [number, number, number], y: [number, number, number]): number => { const [a, b] = [lum(x), lum(y)]; return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  const ok = (v: [number, number, number]): string => `oklch(${(v[0] * 100).toFixed(1)}% ${v[1].toFixed(3)} ${v[2].toFixed(1)})`;
  let css = "/* GENERATED by scripts/generate.ts from app.config.accent — do not edit. */\n";
  if (app.accent) {
    if (!/^#[0-9a-fA-F]{6}$/.test(app.accent)) throw new Error(`app.config.accent must be #RRGGBB, got ${app.accent}`);
    const base = toOklch(app.accent);
    const white: [number, number, number] = [1, 1, 1];
    const ink: [number, number, number] = [0.114, 0.114, 0.122]; // #1D1D1F
    const surfaceDark: [number, number, number] = [0.173, 0.173, 0.18]; // #2C2C2E (raised, the lightest dark surface)
    // Text on the accent: white when it passes 4.5:1, else near-black (light/fresh accents like mint).
    const onWhite = contrast(toRgb(base), white), onInk = contrast(toRgb(base), ink);
    if (onWhite < 4.5 && onInk < 4.5) throw new Error(`Accent ${app.accent}: neither white (${onWhite.toFixed(2)}:1) nor dark text (${onInk.toFixed(2)}:1) reaches 4.5:1. Pick a lighter or darker accent.`);
    const onAccent = onWhite >= 4.5 ? "oklch(100% 0 0)" : "oklch(21% 0.004 286)";
    const pressed: [number, number, number] = [base[0] - 0.04, base[1], base[2]];
    // Accent as TEXT (links, headings): darken / lighten the same hue until it passes 4.5:1.
    const linkLight: [number, number, number] = [Math.min(base[0], 0.52), base[1], base[2]];
    // Check against the hardest backgrounds: --color-bg light #F5F5F7, --color-surface-raised dark #2C2C2E.
    const bgLight: [number, number, number] = [0.961, 0.961, 0.969];
    while (contrast(toRgb(linkLight), bgLight) < 4.5 && linkLight[0] > 0.2) linkLight[0] -= 0.01;
    const linkDark: [number, number, number] = [Math.max(base[0], 0.68), base[1], base[2]];
    while (contrast(toRgb(linkDark), surfaceDark) < 4.5 && linkDark[0] < 0.95) linkDark[0] += 0.01;
    css += `:root {\n  --color-accent: light-dark(${ok(base)}, ${ok(base)});\n  --color-on-accent: ${onAccent};\n  --color-accent-pressed: light-dark(${ok(pressed)}, ${ok(pressed)});\n  --color-accent-text: light-dark(${ok(linkLight)}, ${ok(linkDark)});\n  --color-accent-tint: light-dark(${ok(base).replace(")", " / 0.1)")}, ${ok(linkDark).replace(")", " / 0.16)")});\n  --color-focus: light-dark(${ok(base)}, ${ok(linkDark)});\n}\n`;
  }
  writeFileSync(join(gen, "accent.css"), css);
  // Static pages (404, offline, policies) use public/tokens.css — give them the same accent.
  const pubTokens = join(pub, "tokens.css");
  if (existsSync(pubTokens) && app.accent) writeFileSync(pubTokens, readFileSync(pubTokens, "utf8") + "\n" + css);
}

// UI languages (forge-app-shell → i18n): bundle only the languages in app.config, English first.
{
  const langs = app.languages;
  if (langs[0] !== "en") throw new Error(`app.config.languages must start with "en" (default language), got ${langs.join(", ")}`);
  for (const lang of langs) {
    if (!existsSync(join(root, "app", "src", "i18n", `${lang}.ts`))) throw new Error(`Missing app/src/i18n/${lang}.ts for language "${lang}".`);
    if (lang === "en") continue;
    const t = app.l10n?.[lang];
    if (!t) throw new Error(`app.config.l10n.${lang} is missing (tagline, description, help, faq) for language "${lang}".`);
    const same = (a: readonly unknown[], b: readonly unknown[], what: string): void => {
      if (a.length !== b.length) throw new Error(`app.config.l10n.${lang}.${what} has ${String(b.length)} items, English has ${String(a.length)}.`);
    };
    same(app.help.steps, t.help.steps, "help.steps");
    same(app.help.features, t.help.features, "help.features");
    same(app.faq, t.faq, "faq");
  }
  writeFileSync(
    join(gen, "locales.ts"),
    `// GENERATED by scripts/generate.ts from app.config.languages — do not edit.\n${langs
      .map((l) => `import { ${l} } from "../i18n/${l}.ts";`)
      .join("\n")}\n\nexport const resources = { ${langs.join(", ")} } as const;\n`,
  );
}

// LICENSE with the current year (never hard-coded).
writeFileSync(
  join(root, "LICENSE"),
  readFileSync(join(assets, "LICENSE.mit"), "utf8").replace("{year}", year),
);

if (unfilled) console.warn(`generate: ${String(unfilled)} {placeholder}(s) still unfilled in content/legal — fill them before release.`);
if (!existsSync(join(pub, "logo.svg"))) console.warn("generate: app/public/logo.svg missing — run /icons.");
console.log(`generate: done for ${app.id}`);
