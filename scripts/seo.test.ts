import { describe, expect, it } from "vitest";
import { app as config, type AppConfig } from "../app.config.ts";
import { lastUpdatedDate, latestReleaseDate, llmsTxt, perAppRobotsTxt, siteVerificationTag, sitemapXml, structuredData } from "./seo.ts";

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
  it("says it is ignored and fills <app-id> outside comments only", () => {
    const template = "# Crawlers ignore robots.txt inside /<app-id>/\nUser-agent: *\nAllow: /\nSitemap: https://h/<app-id>/sitemap.xml\n";
    const robots = perAppRobotsTxt(template, app);
    expect(robots.split("\n")[0]).toMatch(/^# .*crawlers ignore robots\.txt below the host root/);
    expect(robots).toContain("# Crawlers ignore robots.txt inside /<app-id>/");
    expect(robots).toContain(`Sitemap: https://h/${app.id}/sitemap.xml`);
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
