import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { MAX_SHUFFLE_COUNT, nextShuffleCount, normalizeRosterName, parseShuffleCount, rosterFingerprint, type ShuffleCount } from "../src/index.js";

// Shuffle count (DECISIONS 2026-11-22). A failing property prints `seed` + `path`: replay with
// fc.assert(property, { seed, path, endOnFailure: true }) and copy the counterexample into an example test.

const name = fc.stringMatching(/^[A-Za-zА-Яа-яÉé]{1,8}( [A-Za-zА-Яа-я]{1,8})?$/);
const roster = fc.array(name, { minLength: 1, maxLength: 12 });

/** The same people written differently: another order, case and spacing; blank lines in between. */
const cosmeticVariant = (names: readonly string[]) => fc.tuple(
  fc.shuffledSubarray([...names], { minLength: names.length, maxLength: names.length }),
  fc.array(fc.boolean(), { minLength: names.length, maxLength: names.length }),
  fc.constantFrom(" ", "  ", "\t", "  "),
  fc.boolean(),
).map(([order, upper, space, withBlank]) => {
  const written = order.map((entry, index) => `${space}${(upper[index] ?? false) ? entry.toUpperCase() : entry.toLowerCase()}${space}`.replace(/ /g, space));
  return withBlank ? [...written, "   "] : written;
});

/** Applies `shuffles` to an empty memory: each item is the roster written for that shuffle. */
const countAfter = (shuffles: readonly (readonly string[])[]): ShuffleCount | null =>
  shuffles.reduce<ShuffleCount | null>((previous, names) => nextShuffleCount(previous, rosterFingerprint(names)), null);

describe("normalizeRosterName", () => {
  it("trims, collapses whitespace, folds case and composes Unicode (NFC)", () => {
    expect(normalizeRosterName("  Ana \t Maria ")).toBe("ana maria");
    expect(normalizeRosterName("Élena")).toBe(normalizeRosterName("Élena")); // NFD = NFC
    expect(normalizeRosterName("STRASSE")).toBe(normalizeRosterName("Straße"));
    expect(normalizeRosterName("ИВАН")).toBe("иван");
  });
});

describe("rosterFingerprint", () => {
  it("is 14 hex characters and never the names", () => {
    const fingerprint = rosterFingerprint(["Ana", "Boris"]);
    expect(fingerprint).toMatch(/^[0-9a-f]{14}$/);
    expect(fingerprint).not.toContain("ana");
  });
  it("ignores order, case, spacing and blank names; counts a repeated name each time", () => {
    expect(rosterFingerprint(["Ana", "Boris"])).toBe(rosterFingerprint([" boris", "", "ANA  "]));
    expect(rosterFingerprint(["Ana", "Ana", "Boris"])).not.toBe(rosterFingerprint(["Ana", "Boris"]));
  });
  it("a person added, removed or renamed is another roster", () => {
    const base = rosterFingerprint(["Ana", "Boris", "Vesko"]);
    expect(rosterFingerprint(["Ana", "Boris", "Vesko", "Gergana"])).not.toBe(base);
    expect(rosterFingerprint(["Ana", "Boris"])).not.toBe(base);
    expect(rosterFingerprint(["Ana", "Boris", "Vasil"])).not.toBe(base);
    expect(rosterFingerprint(["Ana Boris", "Vesko"])).not.toBe(base); // two names joined ≠ two people
  });
  it("is the same for every cosmetic rewrite of a roster (property)", () => {
    fc.assert(fc.property(roster.chain((names) => fc.tuple(fc.constant(names), cosmeticVariant(names))), ([names, variant]) =>
      rosterFingerprint(names) === rosterFingerprint(variant)));
  });
});

describe("nextShuffleCount", () => {
  it("first shuffle 1, same roster +1, other roster back to 1", () => {
    const first = nextShuffleCount(null, "a");
    expect(first).toEqual({ fingerprint: "a", count: 1 });
    expect(nextShuffleCount(first, "a")).toEqual({ fingerprint: "a", count: 2 });
    expect(nextShuffleCount({ fingerprint: "a", count: 7 }, "b")).toEqual({ fingerprint: "b", count: 1 });
  });
  it(`stops at ${String(MAX_SHUFFLE_COUNT)}`, () => {
    expect(nextShuffleCount({ fingerprint: "a", count: MAX_SHUFFLE_COUNT }, "a").count).toBe(MAX_SHUFFLE_COUNT);
  });
  it("N shuffles of one roster, written any way between them, give N (property)", () => {
    const shuffles = roster.chain((names) => fc.array(cosmeticVariant(names), { minLength: 1, maxLength: 30 }));
    fc.assert(fc.property(shuffles, (written) => countAfter(written)?.count === written.length));
  });
  it("a real change of the people starts again at 1 (property)", () => {
    const change = fc.array(name, { minLength: 2, maxLength: 12 }).chain((names) => fc.tuple(fc.constant(names), fc.integer({ min: 1, max: 5 }), fc.oneof(
      name.map((added) => [...names, added]),
      fc.constant(names.slice(1)),
    )));
    fc.assert(fc.property(change, ([names, before, changed]) => {
      const counted = countAfter(Array.from({ length: before }, () => names));
      return countAfter([...Array.from({ length: before }, () => names), changed])?.count === 1 && counted?.count === before;
    }));
  });
  it("never decreases except to 1 when the roster changes, never leaves 1…999 (property)", () => {
    const start = fc.record({ fingerprint: fc.constantFrom("a", "b"), count: fc.integer({ min: 1, max: MAX_SHUFFLE_COUNT }) });
    fc.assert(fc.property(fc.option(start, { nil: null }), fc.constantFrom("a", "b"), (previous, fingerprint) => {
      const next = nextShuffleCount(previous, fingerprint);
      const isReset = previous?.fingerprint !== fingerprint;
      if (isReset) return next.count === 1;
      return next.count >= previous.count && next.count <= MAX_SHUFFLE_COUNT;
    }));
  });
});

describe("parseShuffleCount", () => {
  it("reads what was stored", () => {
    const stored = { fingerprint: rosterFingerprint(["Ana"]), count: 3 };
    expect(parseShuffleCount(JSON.parse(JSON.stringify(stored)))).toEqual(stored);
  });
  it.each([null, undefined, "3", 3, [], {}, { fingerprint: "zz", count: 1 }, { fingerprint: "0123456789abcd", count: 0 },
    { fingerprint: "0123456789abcd", count: 1000 }, { fingerprint: "0123456789abcd", count: 1.5 }, { fingerprint: "0123456789abcd", count: "2" }])(
    "null for corrupt data %j", (value) => {
      expect(parseShuffleCount(value)).toBeNull();
    });
  it("never throws on anything from storage (property)", () => {
    fc.assert(fc.property(fc.anything(), (value) => {
      const parsed = parseShuffleCount(value);
      return parsed === null || (parsed.count >= 1 && parsed.count <= MAX_SHUFFLE_COUNT);
    }));
  });
});
