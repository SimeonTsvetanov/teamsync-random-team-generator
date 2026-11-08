import { describe, expect, it } from "vitest";
import { accentCss, deriveAccent, displayable } from "./accent.ts";

// TeamSync's mint, oklch(79.7% 0.164 159.7): the light accent whose focus ring was 1.62:1 (2026-11-08).
const MINT = "#3CDC97";

describe("deriveAccent", () => {
  it("mint: the focus ring is ≥ 3:1 on bg, surface and raised surface in both themes", () => {
    const tokens = deriveAccent(MINT);
    expect(tokens.focusContrast).toHaveLength(6);
    for (const { pair, ratio } of tokens.focusContrast) expect(ratio, pair).toBeGreaterThanOrEqual(3);
  });

  it("mint: light-mode focus is the darker accent-text colour, not the light accent", () => {
    const tokens = deriveAccent(MINT);
    expect(tokens.focus).toBe(tokens.text);
    const lightL = Number(/^light-dark\(oklch\(([\d.]+)%/.exec(tokens.focus)?.[1]);
    expect(lightL).toBeLessThanOrEqual(55); // light half darkened (mint is 79.7 %); dark half may stay mint
    expect(tokens.onAccent).toBe("oklch(21% 0.004 286)"); // dark text on mint
  });

  it("default blue keeps white text and a passing focus ring", () => {
    const tokens = deriveAccent("#0071E3");
    expect(tokens.onAccent).toBe("oklch(100% 0 0)");
    expect(Math.min(...tokens.focusContrast.map((c) => c.ratio))).toBeGreaterThanOrEqual(3);
  });

  it("rejects a malformed colour and one no text colour can sit on", () => {
    expect(() => deriveAccent("mint")).toThrow(/#RRGGBB/);
    expect(() => deriveAccent("#808080")).toThrow(/reaches 4.5:1/);
  });

  it("accentCss writes every token into the tokens layer", () => {
    const css = accentCss(deriveAccent(MINT));
    expect(css).toMatch(/^@layer tokens \{/);
    for (const name of ["--color-accent:", "--color-on-accent:", "--color-accent-pressed:", "--color-accent-text:", "--color-accent-tint:", "--color-focus:"]) expect(css).toContain(name);
  });

  it("vivid accents either pass every check or fail the build with a reason", () => {
    for (const hex of ["#FF0000", "#00FF00", "#0000FF", "#FFD60A", "#FF2D55"]) {
      try {
        const tokens = deriveAccent(hex);
        expect(Math.min(...tokens.focusContrast.map((c) => c.ratio)), hex).toBeGreaterThanOrEqual(3);
      } catch (e: unknown) {
        expect(String(e), hex).toMatch(/4\.5:1/);
      }
    }
  });
});

describe("displayable", () => {
  it("lowers chroma of an out-of-sRGB colour and keeps the in-gamut one as written", () => {
    const [, chroma] = displayable([0.5, 0.4, 140]);
    expect(chroma).toBeLessThan(0.4);
    expect(displayable([0.5, chroma, 140])).toEqual([0.5, chroma, 140]);
    expect(displayable([0.797, 0.164, 159.7])).toEqual([0.797, 0.164, 159.7]); // mint is inside sRGB
  });
});
