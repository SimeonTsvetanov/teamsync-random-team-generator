// Tiny DOM builder of the body (a copy of the standalone app's ui/dom.ts `h`: the package cannot
// import app/). Text goes in through textContent/append, never parsed as HTML.

/**
 * Creates an element with string attributes and children.
 * @param tag - the element name
 * @param props - attributes; `class` sets `className`
 * @param children - nodes or text (text becomes a text node, never markup)
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Readonly<Record<string, string>> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(props)) {
    if (name === "class") element.className = value;
    else element.setAttribute(name, value);
  }
  element.append(...children);
  return element;
}
