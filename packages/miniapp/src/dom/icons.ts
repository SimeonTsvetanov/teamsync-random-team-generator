// The body's Lucide icons (ISC), drawn like the standalone app's ui/icons.ts: inline SVG, 20 px,
// stroke 1.75, currentColor, aria-hidden. Only the marks the team screen shows are bundled.
import { Copy, Eraser, Minus, Plus, Share2, Shuffle, Users, createElement, type IconNode } from "lucide";

const ICONS = { copy: Copy, eraser: Eraser, minus: Minus, plus: Plus, share: Share2, shuffle: Shuffle, users: Users } satisfies Record<string, IconNode>;

/** A mark the body can draw. */
export type IconName = keyof typeof ICONS;

function isIconName(name: string): name is IconName {
  return Object.hasOwn(ICONS, name);
}

/** Returns a 20 px SVG element of the icon. */
export function icon(name: IconName): SVGElement {
  return createElement(ICONS[name], { width: 20, height: 20, "stroke-width": 1.75, "aria-hidden": "true" });
}

/**
 * Puts its icon in front of every `[data-icon]` element under `root` that has none yet.
 * @remarks Idempotent, because on the standalone site the shell's `hydrateIcons()` has already drawn
 * the static markup's icons before the body mounts; inside Quizzard the body draws them itself.
 */
export function hydrateIcons(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-icon]").forEach((element) => {
    const name = element.dataset["icon"] ?? "";
    if (!isIconName(name) || element.firstElementChild instanceof SVGElement) return;
    element.prepend(icon(name));
  });
}
