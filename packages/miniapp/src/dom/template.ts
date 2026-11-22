// Builds DOM from the body's own build-time markup (screen.html) with createElement/setAttribute
// only. Why not a parser: DOMParser, innerHTML and createContextualFragment are HTML sinks (security
// §1, Trusted Types), and the markup is a small, fixed, trusted string this package owns.

/** Elements that never have children or a closing tag. */
const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

/** One token of the markup: a comment, a closing tag, an opening tag or text (in that order). */
const TOKEN = /<!--[\s\S]*?-->|<\/([a-z][a-z0-9-]*)\s*>|<([a-z][a-z0-9-]*)((?:\s+[a-z][a-z0-9:-]*(?:="[^"]*")?)*)\s*\/?>|([^<]+)/giy;
const ATTRIBUTE = /([a-z][a-z0-9:-]*)(?:="([^"]*)")?/gi;

/**
 * Turns trusted markup into a fragment of real nodes.
 * @param markup - the package's own HTML: elements, double-quoted attributes, text and comments
 * @throws {@link SyntaxError} on anything outside that subset — an entity (`&…;`), an `on*`
 * attribute, an unclosed or mismatched tag — because it means screen.html was edited wrongly
 */
export function fragmentFromMarkup(markup: string): DocumentFragment {
  const root = document.createDocumentFragment();
  const open: ParentNode[] = [root];
  const openTags: string[] = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < markup.length) {
    const start = TOKEN.lastIndex;
    const match = TOKEN.exec(markup);
    if (match === null) throw new SyntaxError(`MARKUP_INVALID: unexpected "<" at ${String(start)}`);
    const [, closing, opening, attributes, text] = match;
    const parent = open.at(-1) ?? root;
    if (text !== undefined) parent.append(checkedText(text));
    else if (closing !== undefined) closeTag(closing.toLowerCase(), open, openTags);
    else if (opening !== undefined) {
      const element = createElement(opening.toLowerCase(), attributes ?? "");
      parent.append(element);
      if (!VOID_ELEMENTS.has(element.localName)) {
        open.push(element);
        openTags.push(element.localName);
      }
    }
  }
  if (openTags.length > 0) throw new SyntaxError(`MARKUP_INVALID: <${openTags.join("> <")}> not closed`);
  return root;
}

function checkedText(text: string): string {
  if (text.includes("&")) throw new SyntaxError("MARKUP_INVALID: write the character, not an entity");
  return text;
}

function closeTag(tag: string, open: ParentNode[], openTags: string[]): void {
  if (openTags.at(-1) !== tag) throw new SyntaxError(`MARKUP_INVALID: </${tag}> does not close <${openTags.at(-1) ?? ""}>`);
  openTags.pop();
  open.pop();
}

function createElement(tag: string, attributes: string): HTMLElement {
  const element = document.createElement(tag);
  for (const [, name = "", value = ""] of attributes.matchAll(ATTRIBUTE)) {
    if (/^on/i.test(name)) throw new SyntaxError(`MARKUP_INVALID: event attribute ${name}`);
    element.setAttribute(name, checkedText(value));
  }
  return element;
}
