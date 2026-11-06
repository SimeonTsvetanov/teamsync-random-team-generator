// Regression (Moni 2026-11-06): confirmations use our modal confirmAction(), never the browser's
// confirm()/alert()/prompt() — those can't be styled, translated well or blurred behind.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) && !f.endsWith(".test.ts") ? [p] : [];
});

it("app code never calls the native confirm/alert/prompt dialogs", () => {
  const bad = files(src).filter((f) => /(^|[^\w.])(window\.)?(confirm|alert|prompt)\(/m.test(readFileSync(f, "utf8")));
  expect(bad).toEqual([]);
});
