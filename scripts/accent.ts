// Per-app accent colours (forge-design → design-system §3, accessibility §2): derives the accent
// token set from app.config.accent and refuses colours that fail WCAG. Used by scripts/generate.ts.

type Rgb = readonly [number, number, number];
type Oklch = readonly [number, number, number];

/** The generated accent tokens, each as a `light-dark()` pair of oklch() strings. */
export interface AccentTokens {
  readonly accent: string;
  readonly onAccent: string;
  readonly pressed: string;
  readonly text: string;
  readonly tint: string;
  readonly focus: string;
  /** Focus ring contrast against every background it sits on (1.4.11 needs ≥ 3:1). */
  readonly focusContrast: readonly { readonly pair: string; readonly ratio: number }[];
}

// The hardest backgrounds for accent text: light --color-bg #F5F5F7, dark --color-surface-raised #2C2C2E.
const HARDEST_LIGHT: Rgb = [0.961, 0.961, 0.969];
const HARDEST_DARK: Rgb = [0.173, 0.173, 0.18];
// The template's backgrounds (design/tokens.css): bg, surface, surface-raised per theme.
const BACKGROUNDS: readonly { readonly name: string; readonly light: Rgb; readonly dark: Rgb }[] = [
  { name: "--color-bg", light: HARDEST_LIGHT, dark: [0, 0, 0] }, // #F5F5F7 / #000000
  { name: "--color-surface", light: [1, 1, 1], dark: [0.11, 0.11, 0.118] }, // #FFFFFF / #1C1C1E
  { name: "--color-surface-raised", light: [1, 1, 1], dark: HARDEST_DARK }, // #FFFFFF / #2C2C2E
];
const WHITE: Rgb = [1, 1, 1];
const INK: Rgb = [0.114, 0.114, 0.122]; // #1D1D1F ≈ oklch(21% 0.004 286), written as --color-on-accent
const FOCUS_MIN = 3;

const lin = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const delin = (c: number): number => Math.min(1, Math.max(0, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));

/** Converts #RRGGBB to OKLCH [L 0–1, C, H degrees]. */
function hexToOklch(hex: string): Oklch {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255)) as [number, number, number]; // because map keeps the length 3
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [lightness, Math.hypot(a, bb), ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360];
}

/** Converts OKLCH to linear sRGB, unclipped (values outside 0–1 = outside the sRGB gamut). */
function toLinear([lightness, chroma, hue]: Oklch): Rgb {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}

/** Converts OKLCH to sRGB (0–1); callers pass displayable() colours, so nothing is clipped. */
function toRgb(v: Oklch): Rgb {
  const [r, g, b] = toLinear(v);
  return [delin(r), delin(g), delin(b)];
}

/**
 * Returns the colour exactly as it will be written (fmt precision) with the chroma lowered until
 * it is inside sRGB — so the contrast measured here is the contrast the browser paints.
 */
export function displayable([lightness, chroma, hue]: Oklch): Oklch {
  const v: [number, number, number] = [Math.round(lightness * 1000) / 1000, Math.round(chroma * 1000) / 1000, Math.round(hue * 10) / 10];
  const isInside = (c: Oklch): boolean => toLinear(c).every((x) => x >= -1e-4 && x <= 1 + 1e-4);
  while (!isInside(v) && v[1] > 0) v[1] = Math.max(0, Math.round((v[1] - 0.001) * 1000) / 1000);
  return v;
}

/** Returns the WCAG 2.2 contrast ratio of two sRGB colours. */
export function contrast(x: Rgb, y: Rgb): number {
  const lum = (c: Rgb): number => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const [a, b] = [lum(x), lum(y)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const fmt = (v: Oklch, alpha = ""): string => `oklch(${(v[0] * 100).toFixed(1)}% ${v[1].toFixed(3)} ${v[2].toFixed(1)}${alpha})`;
const pair = (light: string, dark: string): string => `light-dark(${light}, ${dark})`;

/**
 * Derives the accent token set from a #RRGGBB accent: text on it, pressed state, accent as text
 * (≥ 4.5:1) and the focus ring (≥ 3:1 on every background, both themes).
 * @throws {@link Error} when the colour is not #RRGGBB, no text colour reaches 4.5:1 on it or on
 * its pressed shade, accent text misses 4.5:1, or the focus ring misses 3:1 (accessibility §2).
 */
export function deriveAccent(hex: string): AccentTokens {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`app.config.accent must be #RRGGBB, got ${hex}`);
  const base = displayable(hexToOklch(hex));
  const onWhite = contrast(toRgb(base), WHITE);
  const onInk = contrast(toRgb(base), INK);
  if (onWhite < 4.5 && onInk < 4.5) throw new Error(`Accent ${hex}: neither white (${onWhite.toFixed(2)}:1) nor dark text (${onInk.toFixed(2)}:1) reaches 4.5:1. Pick a lighter or darker accent.`);
  const onAccent = onWhite >= 4.5 ? WHITE : INK;
  const pressed = displayable([base[0] - 0.04, base[1], base[2]]);
  const onPressed = contrast(toRgb(pressed), onAccent);
  if (onPressed < 4.5) throw new Error(`Accent ${hex}: text on the pressed accent is ${onPressed.toFixed(2)}:1 (needs 4.5:1). Pick a lighter or darker accent.`);
  // Accent as TEXT: darken / lighten the same hue until it passes 4.5:1 on the hardest background.
  let textLight = displayable([Math.min(base[0], 0.52), base[1], base[2]]);
  while (contrast(toRgb(textLight), HARDEST_LIGHT) < 4.5 && textLight[0] > 0.2) textLight = displayable([textLight[0] - 0.01, base[1], base[2]]);
  let textDark = displayable([Math.max(base[0], 0.68), base[1], base[2]]);
  while (contrast(toRgb(textDark), HARDEST_DARK) < 4.5 && textDark[0] < 0.95) textDark = displayable([textDark[0] + 0.01, base[1], base[2]]);
  const textContrast = [contrast(toRgb(textLight), HARDEST_LIGHT), contrast(toRgb(textDark), HARDEST_DARK)];
  if (textContrast.some((r) => r < 4.5)) throw new Error(`Accent ${hex}: accent text reaches only ${textContrast.map((r) => r.toFixed(2)).join(" / ")}:1 (light / dark; needs 4.5:1).`);
  // Focus = accent-text in both themes: a light accent (mint, yellow) is < 3:1 on light surfaces.
  const focusContrast = BACKGROUNDS.flatMap((bg) => [
    { pair: `light --color-focus on ${bg.name}`, ratio: contrast(toRgb(textLight), bg.light) },
    { pair: `dark --color-focus on ${bg.name}`, ratio: contrast(toRgb(textDark), bg.dark) },
  ]);
  const weak = focusContrast.filter((c) => c.ratio < FOCUS_MIN);
  if (weak.length) throw new Error(`Accent ${hex}: focus ring below ${String(FOCUS_MIN)}:1 — ${weak.map((c) => `${c.pair} ${c.ratio.toFixed(2)}:1`).join(", ")}`);
  return {
    accent: pair(fmt(base), fmt(base)),
    onAccent: onAccent === WHITE ? "oklch(100% 0 0)" : "oklch(21% 0.004 286)",
    pressed: pair(fmt(pressed), fmt(pressed)),
    text: pair(fmt(textLight), fmt(textDark)),
    tint: pair(fmt(base, " / 0.1"), fmt(textDark, " / 0.16")),
    focus: pair(fmt(textLight), fmt(textDark)),
    focusContrast,
  };
}

/** Returns the generated accent.css (same `tokens` layer as design/tokens.css, loaded after it). */
export function accentCss(tokens: AccentTokens): string {
  return `@layer tokens {\n  :root {\n    --color-accent: ${tokens.accent};\n    --color-on-accent: ${tokens.onAccent};\n    --color-accent-pressed: ${tokens.pressed};\n    --color-accent-text: ${tokens.text};\n    --color-accent-tint: ${tokens.tint};\n    --color-focus: ${tokens.focus};\n  }\n}\n`;
}
