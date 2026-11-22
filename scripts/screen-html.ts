// Puts the team screen's markup (packages/miniapp/src/screen.html) into app/index.html at build time,
// so the served page still has the form before JavaScript runs (SEO, no-JS) while the markup has
// one source that Quizzard renders too (PLAN TS-01). Used by app/vite.config.ts.

/** The comment in app/index.html that the screen replaces. */
export const SCREEN_MARKER = "<!--teams-screen-->";

/**
 * Replaces the marker line with the screen markup, every line indented like the marker.
 * @param html - the page with exactly one marker line
 * @param screen - the screen markup, written without the page's indentation
 * @returns the page with the screen in place of the marker
 * @throws {@link Error} `SCREEN_MARKER_MISSING` when the page has no marker line or more than one
 */
export function injectScreen(html: string, screen: string): string {
  const markerLine = new RegExp(`^( *)${SCREEN_MARKER}\\n`, "gm");
  const count = [...html.matchAll(markerLine)].length;
  if (count !== 1) throw new Error(`SCREEN_MARKER_MISSING: app/index.html needs one "${SCREEN_MARKER}" line, found ${String(count)}`);
  // A replacer function: "$&" or "$'" inside the markup must stay literal.
  return html.replace(markerLine, (_line, indent: string) => indentLines(screen, indent));
}

function indentLines(text: string, indent: string): string {
  return text.split("\n").map((line) => (line === "" ? line : indent + line)).join("\n");
}
