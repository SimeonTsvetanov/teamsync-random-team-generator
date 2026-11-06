// Static rules for all app code (forge-design ui-patterns §4, forge-engineering performance §3).
// Each rule here exists because it was missed once — see forge docs/LEARNINGS-LOG.md.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = dirname(fileURLToPath(import.meta.url));
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  if (statSync(p).isDirectory()) return f === "generated" ? [] : files(p);
  return /\.tsx?$/.test(f) && !f.endsWith(".test.ts") ? [p] : [];
});
const offenders = (re: RegExp): string[] => files(src).filter((f) => re.test(readFileSync(f, "utf8"))).map((f) => relative(src, f));

describe("app rules", () => {
  it("never calls the browser's confirm/alert/prompt — use confirmAction() or showUndo()", () => {
    expect(offenders(/(^|[^\w.])(window\.)?(confirm|alert|prompt)\(/m)).toEqual([]);
  });
  it("never listens to unload/beforeunload — it disables the back/forward cache (use pagehide)", () => {
    expect(offenders(/addEventListener\(\s*["'](before)?unload["']|\bon(before)?unload\s*=/)).toEqual([]);
  });
  it("never uses innerHTML/outerHTML/insertAdjacentHTML with data — build DOM with h()", () => {
    expect(offenders(/\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML\(/)).toEqual([]);
  });
});
