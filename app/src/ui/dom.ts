/** Tiny DOM helpers — textContent only, never innerHTML with data. */
import { getLanguage, t } from "../i18n/index.ts";

/** Creates an element with string attributes and children (text is set via textContent, never parsed as HTML). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") el.className = v;
    else el.setAttribute(k, v);
  }
  el.append(...children);
  return el;
}

/** Code block with a Copy button that turns into "Copied ✓" (APP-STANDARD §3). */
export function copyBlock(code: string): HTMLElement {
  // tabindex: horizontally scrollable code must be reachable by keyboard (WCAG 2.1.1, axe scrollable-region-focusable).
  const pre = h("pre", { class: "code", tabindex: "0", "aria-label": t("shell.codeExample") }, h("code", {}, code));
  const button = h("button", { class: "copy", type: "button" }, t("shell.copy"));
  button.addEventListener("click", () => {
    void navigator.clipboard.writeText(code).then(() => {
      button.textContent = t("shell.copied");
      setTimeout(() => { button.textContent = t("shell.copy"); }, 2000);
    });
  });
  return h("div", { class: "code-block" }, pre, button);
}

/** Decimal byte units, largest first (SI, as macOS Finder and storage APIs report them). */
const BYTE_UNITS = [["gigabyte", 1e9], ["megabyte", 1e6], ["kilobyte", 1e3]] as const;

/** Formats a byte count in the UI language, e.g. "1.2 MB". */
export function formatBytes(bytes: number): string {
  const [unit, size] = BYTE_UNITS.find(([, unitSize]) => bytes > unitSize) ?? BYTE_UNITS[2];
  return new Intl.NumberFormat(getLanguage(), { style: "unit", unit, maximumFractionDigits: 1 }).format(bytes / size);
}
