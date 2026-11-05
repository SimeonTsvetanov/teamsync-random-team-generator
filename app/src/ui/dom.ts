/** Tiny DOM helpers — textContent only, never innerHTML with data. */
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
  const pre = h("pre", { class: "code", tabindex: "0", "aria-label": "Code example" }, h("code", {}, code));
  const button = h("button", { class: "copy", type: "button" }, "Copy");
  button.addEventListener("click", () => {
    void navigator.clipboard.writeText(code).then(() => {
      button.textContent = "Copied ✓";
      setTimeout(() => { button.textContent = "Copy"; }, 2000);
    });
  });
  return h("div", { class: "code-block" }, pre, button);
}

export const formatBytes = (n: number): string =>
  new Intl.NumberFormat(undefined, { style: "unit", unit: n > 1e9 ? "gigabyte" : n > 1e6 ? "megabyte" : "kilobyte", maximumFractionDigits: 1 })
    .format(n > 1e9 ? n / 1e9 : n > 1e6 ? n / 1e6 : n / 1e3);
