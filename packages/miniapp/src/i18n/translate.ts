// The body's own translator (Quizzard PLAN §1.2: a mini-app translates its own subtree with its own
// dictionaries). Resolves keys, `_one`/`_other` plurals and `{{placeholders}}` the way the
// standalone app's i18next setup does (escapeValue off: every text goes in through textContent).
import type { Lang } from "../contract.ts";
import { bg } from "./bg.ts";
import { en, type Messages } from "./en.ts";

/** Dotted paths of every text in a dictionary, e.g. `"error.NAMES_EMPTY"`. */
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** A plural pair `x_one` / `x_other` is asked for as `x` with a `count`. */
type PluralBase<K> = K extends `${infer Base}_${"one" | "other"}` ? Base : K;

/** Every key the body may translate. */
export type TextKey = PluralBase<Paths<typeof en>>;

/** Values for `{{placeholders}}`; `count` also picks the plural form. */
export type TextValues = Readonly<Record<string, string | number>>;

/** Returns the text of `key` in one language. */
export type Translate = (key: TextKey, values?: TextValues) => string;

const DICTIONARIES: Readonly<Record<Lang, Messages>> = { en, bg };

/** Reads a dotted path; undefined when any part is missing. */
function lookup(messages: Messages, path: string): string | undefined {
  let node: unknown = messages;
  for (const part of path.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = Reflect.get(node, part);
  }
  return typeof node === "string" ? node : undefined;
}

/** The plural form first (`x_one`), then `x_other`, then the plain key. */
function candidates(lang: Lang, key: string, values: TextValues | undefined): readonly string[] {
  const count = values?.["count"];
  if (typeof count !== "number") return [key];
  return [`${key}_${new Intl.PluralRules(lang).select(count)}`, `${key}_other`, key];
}

function interpolate(text: string, values: TextValues | undefined): string {
  if (values === undefined) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) => {
    const value = values[name];
    return value === undefined ? placeholder : String(value);
  });
}

/**
 * Creates the translator of one language; a key missing there falls back to English.
 * @param lang - the language the host shows
 * @returns a function that resolves a key, its plural form and its placeholders
 */
export function createTranslator(lang: Lang): Translate {
  return (key, values) => {
    for (const messages of [DICTIONARIES[lang], en]) {
      for (const candidate of candidates(lang, key, values)) {
        const text = lookup(messages, candidate);
        if (text !== undefined) return interpolate(text, values);
      }
    }
    // A missing key is a bug in this package; show the key like i18next does, never throw in the UI.
    return key;
  };
}
