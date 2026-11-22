// @vitest-environment jsdom
// The sink-free markup builder (dom/template.ts) against the browser's own parser, on the real
// screen.html, plus the inputs it must refuse.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fragmentFromMarkup } from "../src/dom/template.ts";

// A path, not a URL object: jsdom replaces the global URL, which node:fs does not accept.
const screenMarkup = readFileSync(fileURLToPath(import.meta.resolve("../src/screen.html")), "utf8");

/** Describes a node tree (element names, attributes in order, text), without any HTML sink. */
const shape = (node: Node): string => {
  if (node instanceof Element) {
    const attributes = [...node.attributes].map((attribute) => `${attribute.name}=${JSON.stringify(attribute.value)}`).join(" ");
    return `<${node.localName} ${attributes}>${[...node.childNodes].map(shape).join("")}</${node.localName}>`;
  }
  return node.nodeType === Node.TEXT_NODE ? JSON.stringify(node.textContent) : "";
};
const html = (fragment: DocumentFragment): string => [...fragment.childNodes].map(shape).join("");
const parsed = (markup: string): DocumentFragment => {
  const body = new DOMParser().parseFromString(`<body>${markup}</body>`, "text/html").body;
  const fragment = document.createDocumentFragment();
  fragment.append(...[...body.childNodes].map((node) => document.importNode(node, true)));
  return fragment;
};

describe("fragmentFromMarkup", () => {
  it("builds screen.html exactly like the browser's parser", () => {
    expect(html(fragmentFromMarkup(screenMarkup))).toBe(html(parsed(screenMarkup)));
  });

  it("keeps boolean attributes, void elements and text, and skips comments", () => {
    const fragment = fragmentFromMarkup('<p hidden data-x="1">a <!-- note --><br>b</p>');
    expect(html(fragment)).toBe('<p hidden="" data-x="1">"a "<br ></br>"b"</p>');
  });

  it.each([
    ["an entity", "<p>&amp;</p>"],
    ["an entity in an attribute", '<p title="&lt;"></p>'],
    ["an event attribute", '<button onclick="x()"></button>'],
    ["a mismatched tag", "<p><span></p></span>"],
    ["an unclosed tag", "<section><p></p>"],
    ["a stray <", "<p>1 < 2</p>"],
  ])("refuses %s", (_name, markup) => {
    expect(() => fragmentFromMarkup(markup)).toThrow(/^MARKUP_INVALID/);
  });
});
