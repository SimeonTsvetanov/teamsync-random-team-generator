// Lucide icons (ISC) rendered as inline SVG — currentColor, aria-hidden.
import { Bug, Check, CircleQuestionMark, Code, Coffee, Copy, Download, FileText, Info, Mail, Menu, Minus, Monitor, Plus, Shuffle, Eraser, Users, Moon, Settings, Share2, Sparkles, Sun, WifiOff, X, createElement, type IconNode } from "lucide";

export const icons = { bug: Bug, check: Check, help: CircleQuestionMark, coffee: Coffee, copy: Copy, download: Download, info: Info, menu: Menu, monitor: Monitor, moon: Moon, settings: Settings, share: Share2, sparkles: Sparkles, sun: Sun, offline: WifiOff, close: X, doc: FileText, mail: Mail, code: Code, minus: Minus, plus: Plus, shuffle: Shuffle, eraser: Eraser, users: Users } satisfies Record<string, IconNode>;
export type IconName = keyof typeof icons;

/** Returns an SVG element for the icon (20px by default). */
export function icon(name: IconName, size = 20): SVGElement {
  return createElement(icons[name], { width: size, height: size, "stroke-width": 1.75, "aria-hidden": "true" });
}

/** Replaces the content of every [data-icon] element with its icon. */
export function hydrateIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-icon]").forEach((el) => {
    const name = el.dataset["icon"] as IconName | undefined;
    if (name && name in icons) el.prepend(icon(name));
  });
}
