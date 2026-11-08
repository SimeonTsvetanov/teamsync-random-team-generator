/**
 * Search and agent files built from app.config.ts (forge-growth → seo-geo). Pure functions: used by
 * scripts/generate.ts (sitemap.xml, robots.txt, llms.txt) and app/vite.config.ts (head, JSON-LD).
 */
import type { AppConfig, FieldDoc } from "../app.config.ts";

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
 * counts at the host root, seo-geo §6), so a header says so. The template's leading comment block is
 * maintainer notes (where the file lives, what to re-check) and never ships; `<app-id>` is filled
 * everywhere else, and a leftover template instruction ("Replace …") is dropped.
 */
export function perAppRobotsTxt(template: string, app: AppConfig): string {
  const header = [
    `# ${app.url}robots.txt — documentation only: crawlers ignore robots.txt below the host root.`,
    "# The live policy is the hub's https://simeontsvetanov.github.io/robots.txt (until it exists, all bots",
    "# are allowed by default and the sitemap is submitted in Search Console and Bing Webmaster Tools).",
    "",
  ];
  const lines = template.replace(/\r\n/g, "\n").split("\n");
  const firstRule = lines.findIndex((line) => line.trim() !== "" && !line.startsWith("#"));
  const body = lines
    .slice(firstRule === -1 ? lines.length : firstRule)
    .filter((line) => !(line.startsWith("#") && /\breplace\b|<app-id>/i.test(line)))
    .map((line) => line.replaceAll("<app-id>", app.id));
  return [...header, ...body].join("\n");
}

/** Returns the privacy facts shared by llms.txt and llms-full.txt (one fact, one place). */
export function privacySummary(app: AppConfig): string {
  // "files" only for apps that take files (limits.maxFileMB set); otherwise what people type or paste.
  const what = app.limits.maxFileMB ? "files never leave the device" : "what you type or paste is processed on the device and never uploaded";
  const browser = `In the browser, ${what}. No accounts, cookies, tracking or analytics.`;
  return app.modes.api ? `${browser} The HTTP API processes the input in memory to return the result and does not store it.` : browser;
}

/** Returns one Markdown bullet per field: `- \`name\` (type, optional, limits): meaning`. */
function fieldLines(fields: readonly FieldDoc[], indent = ""): string[] {
  if (!fields.length) return [`${indent}- (no fields)`];
  return fields.map((f) => {
    const notes = [f.type, f.required === false ? "optional" : "required", f.limits ?? ""].filter(Boolean).join(", ");
    return `${indent}- \`${f.name}\` (${notes}): ${f.meaning}`;
  });
}

/**
 * Returns the exact machine reference (URL parameters, embed contract, HTTP API, MCP tools) as
 * Markdown sections. One renderer for llms-full.txt and the generated part of docs/API.md, so both
 * always say what app.config.ts says.
 */
export function agentReference(app: AppConfig, level = "##"): string[] {
  const m = app.modes;
  const pub = m.urlParams.filter((u) => !u.internal);
  const internal = m.urlParams.filter((u) => u.internal);
  const out: string[] = [`${level} URL parameters`];
  if (pub.length) {
    out.push(...pub.map((u) => `- \`${u.name}\` = ${u.values} (default ${u.default}): ${u.meaning}`));
  } else if (!m.postMessage) out.push("- none");
  if (m.postMessage) out.push(`- \`embed\` = 1: compact embed mode (also automatic inside an iframe); see Embed below`);
  const example = pub.filter((u) => /^[^\s]+$/.test(u.default)); // only literal defaults make a real link
  if (example.length) out.push(`- Example: ${app.url}?${example.map((u) => `${u.name}=${encodeURIComponent(u.default)}`).join("&")}`);
  if (internal.length) out.push("", "Internal (set by the app or the operating system; not for links you write):", ...internal.map((u) => `- \`${u.name}\` = ${u.values}: ${u.meaning}`));
  if (app.shortcuts?.length) out.push("", "App shortcuts (long-press the installed app icon):", ...app.shortcuts.map((s) => `- ${s.name}: ${new URL(s.url, app.url).href}`));
  out.push("", `${level} Embed (iframe + postMessage)`);
  if (m.postMessage) {
    const pm = m.postMessage;
    out.push(
      `- Markup: <iframe src="${app.url}?embed=1" title="${app.name}"></iframe>`,
      "- Origin rules: the app only works with the page that embeds it — its origin is taken from document.referrer.",
      "  Requests are accepted only when event.origin equals that origin and event.source is window.parent; anything else",
      "  (including messages that fail validation or are too large) is ignored without a reply. The app posts events only",
      "  to that exact origin, never \"*\". With no referrer (e.g. referrerpolicy=\"no-referrer\") the embed stays silent.",
      `- Every message is an object \`{ type: "${pm.prefix}:<name>", ...payload }\`.`,
      "",
      "Requests (host page → app):",
      ...(pm.requests.length ? pm.requests.flatMap((r) => [`- \`${pm.prefix}:${r.type}\`: ${r.meaning}`, ...fieldLines(r.payload, "  ")]) : ["- none"]),
      "",
      "Events (app → host page):",
      ...pm.events.flatMap((e) => [`- \`${pm.prefix}:${e.type}\`: ${e.meaning}`, ...fieldLines(e.payload, "  ")]),
    );
  } else out.push("- not available");
  out.push("", `${level} HTTP API`);
  out.push(m.api ? `- Base: ${m.api.baseUrl} · OpenAPI: ${m.api.baseUrl}/${m.api.openapi} · errors: {"error":{"code","message","requestId"}} · 429 = rate limited` : "- none: there is no HTTP API (the app runs in the browser; agents use the MCP server)");
  out.push("", `${level} MCP`);
  if (m.mcp) {
    out.push(`- Local (stdio): npx -y ${m.mcp.npm}`, ...(m.mcp.url ? [`- Remote (streamable HTTP): ${m.mcp.url}`] : []));
    out.push(`- Client config: {"mcpServers":{"${app.id}":{"command":"npx","args":["-y","${m.mcp.npm}"]}}}`);
    for (const tool of m.mcp.tools) {
      out.push(
        "", `${level}# Tool \`${tool.name}\``, tool.description, "",
        "Input (arguments):", ...fieldLines(tool.input), "",
        "Output (structuredContent; the text content holds the same result for people):", ...fieldLines(tool.output), "",
        ...(tool.errors ? [`Errors: ${tool.errors}`, ""] : []),
        "Example call:", `- arguments: ${tool.example.arguments}`, `- structuredContent: ${tool.example.result}`,
      );
    }
  } else out.push("- not available");
  return out;
}

/** Returns llms-full.txt — the complete reference for agents (APP-STANDARD §10, seo-geo §8). */
export function llmsFullTxt(app: AppConfig): string {
  const m = app.modes;
  const limits = [
    app.limits.maxFileMB ? `- Max file size: ${String(app.limits.maxFileMB)} MB` : "",
    app.limits.maxItems ? `- Max items: ${String(app.limits.maxItems)}` : "",
  ].filter(Boolean);
  return [
    `# ${app.name} — full reference`, "", `> ${app.tagline}`, "", app.description, "", `Version: ${app.version}`, "",
    "## Usage modes",
    `- Browser: ${app.url} (installable PWA, works offline after first visit)`,
    ...(m.mcp ? [`- MCP (local): npx -y ${m.mcp.npm}`] : []),
    ...(m.mcp?.url ? [`- MCP (remote): ${m.mcp.url}`] : []),
    ...(m.api ? [`- HTTP API: ${m.api.baseUrl} (OpenAPI: ${m.api.openapi})`] : []),
    ...(m.postMessage ? ["- Embed: iframe + postMessage (below)"] : []), "",
    ...agentReference(app), "",
    ...(limits.length ? ["## Limits", ...limits, ""] : []),
    ...(app.languages.length > 1 ? ["## Languages", `- UI: ${app.languages.join(", ")} (English is the default).`, ""] : []),
    "## How to use (steps)", ...app.help.steps.map((t, i) => `${String(i + 1)}. ${t}`), "",
    ...(app.help.features.length ? ["## Features", ...app.help.features.map((f) => `- ${f.name}: ${f.text}`), ""] : []),
    "## FAQ", ...app.faq.flatMap((f) => [`### ${f.q}`, f.a]), "",
    "## Privacy", `- ${privacySummary(app)}`, "",
    "## About", `- Licence: MIT · Source: ${app.repo} · Author: ${app.author.name} · Support: ${app.support.buyMeACoffee}`, "",
  ].join("\n");
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

/** Returns the short MCP + embed paragraphs of llms.txt (exact schemas live in llms-full.txt). */
function agentSummary(app: AppConfig): string[] {
  const { mcp, postMessage: pm } = app.modes;
  const sig = (fields: readonly FieldDoc[]): string => fields.map((f) => `${f.name}${f.required === false ? "?" : ""}: ${f.type}`).join(", ");
  return [
    ...(mcp?.tools ?? []).map((t) => `MCP tool \`${t.name}\`(${sig(t.input)}) → { ${sig(t.output)} }. ${t.description} Example arguments: ${t.example.arguments}`),
    pm ? `Embed: <iframe src="${app.url}?embed=1">; ${pm.requests.length ? `the embedding page sends ${pm.requests.map((r) => `{ type: "${pm.prefix}:${r.type}"${r.payload.length ? `, ${sig(r.payload)}` : ""} }`).join(" or ")}; ` : ""}the app answers with ${pm.events.map((e) => `${pm.prefix}:${e.type}`).join(", ")} to that page's origin only.` : "",
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
    ...agentSummary(app).flatMap((p) => [p, ""]),
    "## Use it", ...useItLinks(app), "",
    "## Optional",
    `- [Full reference](${app.url}llms-full.txt): usage modes, URL parameters, embed contract, MCP tool schemas, limits and features`,
    `- [Privacy](${app.url}privacy/): what is processed and stored`,
    `- [Terms](${app.url}terms/): conditions of use`,
    "",
  ].join("\n");
}
