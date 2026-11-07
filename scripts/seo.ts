/**
 * Search and agent files built from app.config.ts (forge-growth → seo-geo). Pure functions: used by
 * scripts/generate.ts (sitemap.xml, robots.txt, llms.txt) and app/vite.config.ts (head, JSON-LD).
 */
import type { AppConfig } from "../app.config.ts";

/** The og-image that generate.ts renders (seo-geo §3: 1200×630 PNG, absolute URL in the head). */
export const OG_IMAGE = { file: "og-image.png", width: 1200, height: 630, type: "image/png" } as const;

/** Policy pages that get a standalone URL (and a sitemap entry), keyed by content/legal/<slug>.md. */
export const POLICY_PAGES = ["terms", "privacy", "ai-notice", "legal-notice", "support"] as const;

/**
 * Optional search settings (`app.config.seo`). Read structurally, so a config written before the
 * field joined AppConfig still type-checks.
 */
export interface SeoSettings {
  readonly seo?: { readonly googleVerification?: string };
}

/** One sitemap entry; `lastmod` is omitted when the page's real last change is unknown (seo-geo §6). */
export interface SitemapPage {
  readonly path: string;
  readonly lastmod?: string;
}

const ISO_DATE = /\d{4}-\d{2}-\d{2}/;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Returns text safe for HTML text and double-quoted attributes. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Returns the absolute og-image URL. */
export function ogImageUrl(app: AppConfig): string {
  return `${app.url}${OG_IMAGE.file}`;
}

/** Returns the alt text of the og-image — it shows the logo, the name and the tagline. */
export function ogImageAlt(app: AppConfig): string {
  return `${app.name} logo with the tagline: ${app.tagline}`;
}

/** Returns the `google-site-verification` meta tag, or "" when no token is configured. */
export function siteVerificationTag(app: AppConfig & SeoSettings): string {
  const token = app.seo?.googleVerification?.trim();
  return token ? `<meta name="google-site-verification" content="${escapeHtml(token)}" />` : "";
}

/**
 * Returns the JSON-LD items for the app page: WebApplication (entity data, never ratings) and
 * FAQPage (kept as data only; its text equals the visible FAQ) — seo-geo §5.
 */
export function structuredData(app: AppConfig): readonly object[] {
  const author = { "@type": "Person", name: app.author.name, sameAs: [app.author.github, app.author.linkedin].filter(Boolean) };
  const features = app.help.features.map((f) => f.name);
  const webApplication = {
    "@context": "https://schema.org", "@type": "WebApplication", name: app.name, url: app.url,
    description: app.description, image: ogImageUrl(app), applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any — runs in the browser", browserRequirements: "Requires JavaScript and a current browser (Chrome, Edge, Firefox or Safari).",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }, isAccessibleForFree: true, inLanguage: "en",
    softwareVersion: app.version, author, sameAs: [app.repo],
    ...(features.length ? { featureList: features } : {}),
  };
  const faqPage = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: app.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return [webApplication, faqPage];
}

/** Returns the date (YYYY-MM-DD) of the newest dated release in a Keep-a-Changelog file, if any. */
export function latestReleaseDate(changelog: string): string | undefined {
  for (const heading of changelog.match(/^## .*$/gm) ?? []) {
    if (/unreleased/i.test(heading)) continue;
    const date = ISO_DATE.exec(heading)?.[0];
    if (date) return date;
  }
  return undefined;
}

/** Returns the "Last updated: YYYY-MM-DD" date of a policy source, if it carries a real date. */
export function lastUpdatedDate(markdown: string): string | undefined {
  const visible = markdown.replace(/<!--[\s\S]*?-->/g, ""); // dates in comments are not on the page
  const value = /Last updated:\**\s*\**\s*([^\n*]+)/i.exec(visible)?.[1]?.trim() ?? "";
  const iso = ISO_DATE.exec(value)?.[0];
  if (iso) return iso;
  // House date style (user-docs §5): "6 November 2026".
  const words = /^(\d{1,2}) ([A-Z][a-z]+) (\d{4})/.exec(value);
  const month = words ? MONTHS.indexOf(words[2] ?? "") + 1 : 0;
  if (!words || month === 0) return undefined;
  return `${words[3] ?? ""}-${String(month).padStart(2, "0")}-${(words[1] ?? "").padStart(2, "0")}`;
}

/** Returns sitemap.xml for absolute canonical URLs under `appUrl` (no priority/changefreq). */
export function sitemapXml(appUrl: string, pages: readonly SitemapPage[]): string {
  const urls = pages.map((p) => `  <url><loc>${appUrl}${p.path}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

/**
 * Returns the per-app copy of the host-root robots.txt template. Crawlers ignore it (robots.txt only
 * counts at the host root, seo-geo §6), so a header says so; `<app-id>` is filled only outside comments.
 */
export function perAppRobotsTxt(template: string, app: AppConfig): string {
  const header = [
    `# ${app.url}robots.txt — documentation only: crawlers ignore robots.txt below the host root.`,
    "# The live policy is the hub's https://simeontsvetanov.github.io/robots.txt (until it exists, all bots",
    "# are allowed by default and the sitemap is submitted in Search Console and Bing Webmaster Tools).",
    "",
  ];
  const body = template.split("\n").map((line) => (line.startsWith("#") ? line : line.replaceAll("<app-id>", app.id)));
  return [...header, ...body].join("\n");
}

/** Returns the privacy facts shared by llms.txt and llms-full.txt (one fact, one place). */
export function privacySummary(app: AppConfig): string {
  const browser = "In the browser, files never leave the device. No accounts, cookies, tracking or analytics.";
  return app.modes.api ? `${browser} The HTTP API processes a file in memory to return the result and does not store it.` : browser;
}

/** Returns the limits sentence for agent docs, or "" when the app sets none. */
function limitsSentence(app: AppConfig): string {
  const parts = [
    app.limits.maxFileMB ? `files up to ${String(app.limits.maxFileMB)} MB` : "",
    app.limits.maxItems ? `up to ${String(app.limits.maxItems)} items` : "",
  ].filter(Boolean);
  return parts.length ? `Limits: ${parts.join(", ")}.` : "";
}

/** Returns the "## Use it" link list: every way to use the app, as `- [name](url): note`. */
function useItLinks(app: AppConfig): string[] {
  const { mcp, api } = app.modes;
  return [
    `- [Open ${app.name}](${app.url}): the app in the browser; installable, works offline after the first visit`,
    mcp ? `- [MCP server](https://www.npmjs.com/package/${mcp.npm}): run locally with \`npx -y ${mcp.npm}\`` : "",
    mcp?.url ? `- [Remote MCP server](${mcp.url}): streamable HTTP endpoint` : "",
    api ? `- [HTTP API reference](${api.baseUrl}/${api.openapi}): OpenAPI description of ${api.baseUrl}` : "",
    `- [Source code](${app.repo}): MIT licence`,
  ].filter(Boolean);
}

/**
 * Returns llms.txt in the llmstxt.org format (seo-geo §8): H1 → `>` summary → plain paragraphs
 * (what it does, limits, privacy, FAQ answers) → link-only `## Use it` → `## Optional`.
 * Tables and parameter lists belong in llms-full.txt.
 */
export function llmsTxt(app: AppConfig): string {
  return [
    `# ${app.name}`, "", `> ${app.description}`, "",
    `How to use it: ${app.help.steps.join(" ")}`, "",
    ...[limitsSentence(app), `Privacy: ${privacySummary(app)}`].filter(Boolean).flatMap((p) => [p, ""]),
    ...app.faq.flatMap((f) => [`${f.q} ${f.a}`, ""]),
    "## Use it", ...useItLinks(app), "",
    "## Optional",
    `- [Full reference](${app.url}llms-full.txt): usage modes, URL parameters, embed events, API, MCP and limits`,
    `- [Privacy](${app.url}privacy/): what is processed and stored`,
    `- [Terms](${app.url}terms/): conditions of use`,
    "",
  ].join("\n");
}
