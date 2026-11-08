import { describe, expect, it } from "vitest";
import { app as config, type AppConfig } from "../app.config.ts";
import { lastUpdatedDate, latestReleaseDate, llmsFullTxt, llmsTxt, perAppRobotsTxt, privacySummary, siteVerificationTag, sitemapXml, structuredData } from "./seo.ts";

const app: AppConfig = config;

describe("latestReleaseDate", () => {
  it("skips Unreleased and returns the newest dated release", () => {
    const changelog = "# Changelog\n\n## [Unreleased]\n- x\n\n## [1.2.0] - 2026-10-01\n- y\n\n## [1.1.0] - 2026-09-01\n- z\n";
    expect(latestReleaseDate(changelog)).toBe("2026-10-01");
  });

  it("returns undefined before the first release", () => {
    expect(latestReleaseDate("## [Unreleased]\n- First version.\n")).toBeUndefined();
  });
});

describe("lastUpdatedDate", () => {
  it("reads a real date and ignores the {date} placeholder", () => {
    expect(lastUpdatedDate("**Privacy** — Last updated: 2026-11-01\n")).toBe("2026-11-01");
    expect(lastUpdatedDate("**Privacy** — Last updated: {date}\n")).toBeUndefined();
  });

  it("reads the house date style, bold dates, and ignores dates in comments", () => {
    expect(lastUpdatedDate("**Terms** — Last updated: 6 November 2026\n")).toBe("2026-11-06");
    expect(lastUpdatedDate("Last updated: **2026-10-05**\n")).toBe("2026-10-05");
    expect(lastUpdatedDate("<!-- Last updated: 2026-01-01 -->\nNo date here.\n")).toBeUndefined();
    expect(lastUpdatedDate("Last updated: 6 Brumaire 2026\n")).toBeUndefined();
  });
});

describe("sitemapXml", () => {
  it("writes lastmod only where a real date is known", () => {
    const xml = sitemapXml("https://example.org/a/", [{ path: "", lastmod: "2026-10-01" }, { path: "terms/" }]);
    expect(xml).toContain("<url><loc>https://example.org/a/</loc><lastmod>2026-10-01</lastmod></url>");
    expect(xml).toContain("<url><loc>https://example.org/a/terms/</loc></url>");
    expect(xml).not.toMatch(/priority|changefreq|\?lang=/);
  });
});

describe("perAppRobotsTxt", () => {
  it("says it is ignored, drops the template's notes and fills <app-id>", () => {
    const template = "# HOST ROOT ONLY. Crawlers ignore robots.txt inside /<app-id>/. Replace <app-id>.\n# Re-checked by /stack-check.\nUser-agent: *\nAllow: /\n\n# Search crawlers\nUser-agent: Bingbot\nAllow: /\n# Replace <app-id> below.\nSitemap: https://h/<app-id>/sitemap.xml\n";
    const robots = perAppRobotsTxt(template, app);
    expect(robots.split("\n")[0]).toMatch(/^# .*crawlers ignore robots\.txt below the host root/);
    expect(robots).not.toMatch(/HOST ROOT ONLY|stack-check|Replace|<app-id>/);
    expect(robots).toContain("# Search crawlers");
    expect(robots).toContain(`Sitemap: https://h/${app.id}/sitemap.xml`);
  });
});

describe("agent docs", () => {
  const withModes = (modes: Partial<AppConfig["modes"]>, limits: AppConfig["limits"] = {}): AppConfig => ({ ...app, limits, modes: { ...app.modes, ...modes } });
  const tool = {
    name: "make_x", description: "Makes x.",
    input: [{ name: "items", type: "string[]", limits: "≤ 10 items", meaning: "What to use." }, { name: "mode", type: "string", required: false, meaning: "How." }],
    output: [{ name: "x", type: "string", meaning: "The x." }],
    errors: "isError with { code, message }",
    example: { arguments: '{"items":["a"]}', result: '{"x":"a"}' },
  };

  it("documents every MCP tool exactly: input types/limits, output, an example call", () => {
    const a = withModes({ mcp: { url: null, npm: "@s/x-mcp", tools: [tool] } });
    const full = llmsFullTxt(a);
    expect(full).toContain("Tool `make_x`");
    expect(full).toContain("- `items` (string[], required, ≤ 10 items): What to use.");
    expect(full).toContain("- `mode` (string, optional): How.");
    expect(full).toContain('- arguments: {"items":["a"]}');
    expect(llmsTxt(a)).toContain("MCP tool `make_x`(items: string[], mode?: string) → { x: string }");
  });

  it("documents the embed contract: origin rules, every request and event with its payload", () => {
    const a = withModes({ postMessage: { prefix: "x", requests: [{ type: "make", meaning: "Make it.", payload: [{ name: "n", type: "number", meaning: "N." }] }], events: [{ type: "ready", meaning: "Loaded.", payload: [] }] } });
    const full = llmsFullTxt(a);
    expect(full).toMatch(/event\.origin equals that origin/);
    expect(full).toContain("- `x:make`: Make it.");
    expect(full).toContain("  - `n` (number, required): N.");
    expect(full).toContain("- `x:ready`: Loaded.");
  });

  it("lists internal URL params apart and has no file wording or file limit for apps without files", () => {
    const a = withModes({ urlParams: [{ name: "q", values: "text", default: "none", meaning: "Q." }, { name: "share-target", values: "1", default: "-", meaning: "Set by the OS.", internal: true }] });
    const full = llmsFullTxt(a);
    expect(full).toMatch(/Internal[^\n]*\n- `share-target`/);
    expect(full + llmsTxt(a)).not.toMatch(/files never leave|Max file size/);
    expect(llmsFullTxt(withModes({}, { maxFileMB: 50 }))).toContain("Max file size: 50 MB");
    expect(privacySummary(withModes({}, { maxFileMB: 50 }))).toContain("files never leave the device");
  });

  it("never points the FAQ at llms.txt inside llms.txt (no circular reference)", () => {
    for (const f of app.faq) expect(f.a).not.toMatch(/llms(-full)?\.txt/);
  });
});

describe("structuredData", () => {
  // because structuredData returns plain objects; the test reads their JSON shape
  const [webApplication, faqPage] = structuredData(app) as [Record<string, unknown>, { mainEntity: { name: string }[] }];

  it("describes the app as free English entity data with no ratings", () => {
    expect(webApplication).toMatchObject({ "@type": "WebApplication", isAccessibleForFree: true, inLanguage: "en", image: `${app.url}og-image.png` });
    expect(webApplication).not.toHaveProperty("aggregateRating");
    expect(webApplication).not.toHaveProperty("review");
    expect(webApplication["author"]).toMatchObject({ sameAs: [app.author.github, app.author.linkedin] });
  });

  it("FAQPage questions equal the visible FAQ", () => {
    expect(faqPage.mainEntity.map((q) => q.name)).toEqual(app.faq.map((f) => f.q));
  });
});

describe("siteVerificationTag", () => {
  it("is empty without a token and escaped with one", () => {
    expect(siteVerificationTag({ ...app, seo: {} })).toBe("");
    expect(siteVerificationTag({ ...app, seo: { googleVerification: "  " } })).toBe("");
    expect(siteVerificationTag({ ...app, seo: { googleVerification: 'a"b' } })).toBe('<meta name="google-site-verification" content="a&quot;b" />');
  });
});

describe("llmsTxt", () => {
  const text = llmsTxt(app);
  const sections = text.split(/^## /m);

  it("follows the llmstxt.org order: H1, summary, paragraphs, then link sections", () => {
    expect(text.startsWith(`# ${app.name}\n\n> ${app.description}\n`)).toBe(true);
    expect(sections.slice(1).map((s) => s.split("\n")[0])).toEqual(["Use it", "Optional"]);
    for (const faq of app.faq) expect(sections[0]).toContain(`${faq.q} ${faq.a}`);
  });

  it("has only `- [name](url): note` lines under H2 sections", () => {
    for (const section of sections.slice(1)) {
      const lines = section.split("\n").slice(1).filter((l) => l.trim());
      for (const line of lines) expect(line).toMatch(/^- \[[^\]]+\]\([^)]+\)(: .+)?$/);
    }
  });
});
