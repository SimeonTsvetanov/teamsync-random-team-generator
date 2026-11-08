import { app } from "../config.ts";
import { t, text } from "../i18n/index.ts";
import { copyBlock, h } from "./dom.ts";
import { openDialog } from "./dialog.ts";

/** One Help category = a <details> section; only categories that apply are shown (APP-STANDARD §3). */
function section(title: string, ...content: Node[]): HTMLDetailsElement {
  return h("details", { class: "help-section" }, h("summary", {}, title), h("div", {}, ...content));
}
const p = (s: string): HTMLParagraphElement => h("p", {}, s);
const list = (items: readonly string[], ordered = false): HTMLElement =>
  h(ordered ? "ol" : "ul", {}, ...items.map((i) => h("li", {}, i)));

/** "Events: a, b, c." with each event name as code (identifiers, not text in the UI language). */
function eventsLine(prefix: string, events: readonly { readonly type: string }[]): HTMLParagraphElement {
  const [before = "", after = ""] = t("shell.help.events", { list: "\u0000" }).split("\u0000");
  const names = events.flatMap((e, i) => [...(i ? [", "] : []), h("code", {}, `${prefix}:${e.type}`)]);
  return h("p", {}, before, ...names, after);
}

export function openHelp(): void {
  const m = app.modes;
  const at = text();
  const service: Node[] = [];
  const params = m.urlParams.filter((u) => !u.internal); // internal ones (e.g. share-target) are only in llms-full.txt
  if (params.length) {
    service.push(h("h3", {}, t("shell.help.urlParams")),
      h("table", {}, h("thead", {}, h("tr", {}, ...[t("shell.help.colName"), t("shell.help.colValues"), t("shell.help.colDefault"), t("shell.help.colMeaning")].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...params.map((u) => h("tr", {}, h("td", {}, h("code", {}, u.name)), h("td", {}, u.values), h("td", {}, u.default), h("td", { lang: "en" }, u.meaning))))),
      copyBlock(`${app.url}?${params.map((u) => `${u.name}=${u.default}`).join("&")}`));
  }
  if (m.postMessage) {
    service.push(h("h3", {}, t("shell.help.embed")), copyBlock(`<iframe src="${app.url}?embed=1" title="${app.name}" loading="lazy"></iframe>`),
      eventsLine(m.postMessage.prefix, m.postMessage.events));
  }
  if (m.api) service.push(h("h3", {}, t("shell.help.api")), copyBlock(`curl ${m.api.baseUrl}/`), p(`OpenAPI: ${m.api.baseUrl}/${m.api.openapi}`));
  if (m.n8n) {
    const copyN8n = h("button", { class: "button button--primary", type: "button" }, t("shell.help.n8nCopy"));
    copyN8n.addEventListener("click", () => {
      void fetch("./n8n-workflow.json")
        .then((r) => r.text())
        .then((json) => navigator.clipboard.writeText(json))
        .then(() => { copyN8n.textContent = t("shell.help.n8nCopied"); });
    });
    service.push(h("h3", {}, t("shell.help.n8n")), p(t("shell.help.n8nText")), copyN8n, p(t("shell.help.n8nOneNode")));
  }
  if (m.mcp) {
    service.push(h("h3", {}, t("shell.help.mcp")), p(t("shell.help.mcpText")),
      copyBlock(JSON.stringify({ mcpServers: { [app.id]: { command: "npx", args: ["-y", m.mcp.npm] } } }, null, 2)));
    if (m.mcp.url) service.push(p(t("shell.help.mcpRemote", { url: m.mcp.url })));
  }
  service.push(h("h3", {}, t("shell.help.agents")), p(t("shell.help.agentsText", { a: `${app.url}llms.txt`, b: `${app.url}llms-full.txt` })));

  const sections = [
    section(t("shell.help.whatItDoes"), p(at.description)),
    section(t("shell.help.quickStart"), list(at.help.steps, true)),
    ...(at.help.features.length ? [section(t("shell.help.features"), ...at.help.features.map((f) => h("p", {}, h("strong", {}, `${f.name}: `), f.text)))] : []),
    section(t("shell.help.install"), list([t("shell.help.installAndroid"), t("shell.help.installIOS"), t("shell.help.installDesktop")])),
    section(t("shell.help.service"), ...service),
    section(t("shell.help.privacy"), p(t("shell.help.privacyText")), h("p", {}, h("a", { href: "./privacy/" }, t("shell.help.privacyLink")))),
    section(t("shell.help.limits"), list([
      ...(app.limits.maxFileMB ? [t("shell.help.maxFile", { mb: app.limits.maxFileMB })] : []),
      ...(app.limits.maxItems ? [t("shell.help.maxItems", { n: app.limits.maxItems })] : []),
      t("shell.help.offline"),
      t("shell.help.problem"),
    ])),
    section(t("shell.help.faq"), ...at.faq.map((f) => h("div", { class: "faq" }, h("strong", {}, f.q), p(f.a)))),
    section(t("shell.help.contact"), h("p", {}, h("a", { href: "#report" }, t("shell.menu.report")), " · ", h("a", { href: app.support.buyMeACoffee, target: "_blank", rel: "noopener" }, t("shell.help.coffee")))),
  ];
  sections[0]?.setAttribute("open", "");
  const wide = matchMedia("(min-width: 900px)").matches;
  if (wide) sections.forEach((s) => { s.open = true; });
  openDialog("help", t("shell.help.title"), sections);
}
