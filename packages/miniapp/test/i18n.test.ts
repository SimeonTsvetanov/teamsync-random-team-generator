// The body's dictionaries and translator: same keys and {{placeholders}} in every language, every
// key screen.html uses exists, plurals and the English fallback behave like i18next.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bg } from "../src/i18n/bg.ts";
import { en } from "../src/i18n/en.ts";
import { createTranslator, type TextKey } from "../src/i18n/translate.ts";

const screenMarkup = readFileSync(new URL("../src/screen.html", import.meta.url), "utf8");
interface Tree { readonly [key: string]: string | Tree }
const flat = (tree: Tree, prefix = ""): Map<string, string> => {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === "string") out.set(prefix + key, value);
    else for (const [inner, text] of flat(value, `${prefix}${key}.`)) out.set(inner, text);
  }
  return out;
};
const placeholders = (text: string): string[] => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1] ?? "").sort();
const english = flat(en);

describe("dictionaries", () => {
  it("Bulgarian has the same keys and placeholders as English, none empty", () => {
    const bulgarian = flat(bg);
    expect([...bulgarian.keys()].sort()).toEqual([...english.keys()].sort());
    for (const [key, text] of english) {
      expect(text.trim(), key).not.toBe("");
      expect(placeholders(bulgarian.get(key) ?? ""), key).toEqual(placeholders(text));
    }
  });

  it("has every key screen.html asks for", () => {
    const keys = [...screenMarkup.matchAll(/data-teams-i18n(?:-aria-label)?="([^"]+)"/g)].map((match) => match[1] ?? "");
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) expect(english.has(key), key).toBe(true);
  });
});

describe("createTranslator", () => {
  it("picks the plural form of the language and fills placeholders", () => {
    expect(createTranslator("en")("namesCount", { count: 1 })).toBe("1 name");
    expect(createTranslator("en")("namesCount", { count: 0 })).toBe("0 names");
    expect(createTranslator("bg")("membersCount", { count: 5 })).toBe("5 души");
    expect(createTranslator("en")("error.TEAMS_MORE_THAN_NAMES", { names: 3, teams: 4 })).toBe("You have 3 names — add more names or choose fewer than 4 teams.");
  });

  it("returns the key for an unknown one instead of throwing", () => {
    // because the test asks for a key the type system would refuse.
    expect(createTranslator("bg")("nope" as TextKey)).toBe("nope");
  });
});
