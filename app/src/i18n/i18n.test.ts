// Dictionary checks for every language file in this folder (forge-app-shell → i18n §5).
import { readdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { en } from "./en.ts";

interface Tree { readonly [k: string]: string | Tree }
const flat = (t: Tree, prefix = ""): Map<string, string> => {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(t)) {
    if (typeof v === "string") out.set(prefix + k, v);
    else for (const [kk, vv] of flat(v, `${prefix}${k}.`)) out.set(kk, vv);
  }
  return out;
};
const vars = (s: string): string[] => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1] ?? "").sort();
const dir = dirname(fileURLToPath(import.meta.url));
const langs = readdirSync(dir).filter((f) => /^[a-z]{2}\.ts$/.test(f) && f !== "en.ts").map((f) => f.slice(0, 2));
const base = flat(en);

describe("i18n dictionaries", () => {
  it("English has no empty strings", () => {
    for (const [k, v] of base) expect(v.trim(), k).not.toBe("");
  });
  it.each(langs)("%s has the same keys and {{placeholders}} as English", async (lang) => {
    const mod = (await import(`./${lang}.ts`)) as Record<string, Tree>;
    const other = flat(mod[lang] ?? {});
    expect([...other.keys()].sort()).toEqual([...base.keys()].sort());
    for (const [k, v] of base) {
      const tr = other.get(k) ?? "";
      expect(tr.trim(), `${lang}:${k} empty`).not.toBe("");
      expect(vars(tr), `${lang}:${k} placeholders`).toEqual(vars(v));
    }
  });
});
