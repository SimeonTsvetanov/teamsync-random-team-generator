// The build-time half of the static team screen (PLAN TS-01): app/index.html + screen.html must give
// the page the form markup before any JavaScript runs.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SCREEN_MARKER, injectScreen } from "./screen-html.ts";

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), "utf8");

describe("injectScreen", () => {
  it("puts every screen line at the marker's indentation", () => {
    const page = `<main>\n  <h1>x</h1>\n  ${SCREEN_MARKER}\n  <p>after</p>\n</main>\n`;
    const screen = "<div>\n<section>\n  <form></form>\n</section>\n\n</div>\n";
    expect(injectScreen(page, screen)).toBe("<main>\n  <h1>x</h1>\n  <div>\n  <section>\n    <form></form>\n  </section>\n\n  </div>\n  <p>after</p>\n</main>\n");
  });

  it("keeps $ sequences of the markup literal", () => {
    expect(injectScreen(`${SCREEN_MARKER}\n`, "<p>$& $' $1</p>\n")).toBe("<p>$& $' $1</p>\n");
  });

  it.each([["none", "<main></main>\n"], ["two", `${SCREEN_MARKER}\n${SCREEN_MARKER}\n`]])("refuses a page with %s marker lines", (_name, page) => {
    expect(() => injectScreen(page, "<div></div>\n")).toThrow(/^SCREEN_MARKER_MISSING/);
  });

  it("gives the real page the whole static form, once", () => {
    const html = injectScreen(read("../app/index.html"), read("../packages/miniapp/src/screen.html"));
    expect(html).not.toContain(SCREEN_MARKER);
    for (const hook of ["data-workspace>", "data-teams-form ", 'id="names"', "data-teams-dec ", "data-teams-inc ", "data-results hidden", "data-start-over "]) {
      expect(html.split(hook)).toHaveLength(2);
    }
    expect(html).toMatch(/<\/section>\n {6}<div class="workspace" data-workspace>\n {6}<section class="tool">\n {8}<form class="tool-form" data-teams-form novalidate>/);
  });
});
