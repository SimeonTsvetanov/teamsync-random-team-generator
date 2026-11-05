import { app } from "../config.ts";
import { copyBlock, h } from "./dom.ts";
import { openDialog } from "./dialog.ts";

/** One Help category = a <details> section; only categories that apply are shown (APP-STANDARD §3). */
function section(title: string, ...content: Node[]): HTMLDetailsElement {
  return h("details", { class: "help-section" }, h("summary", {}, title), h("div", {}, ...content));
}
const p = (text: string): HTMLParagraphElement => h("p", {}, text);
const list = (items: readonly string[], ordered = false): HTMLElement =>
  h(ordered ? "ol" : "ul", {}, ...items.map((i) => h("li", {}, i)));

export function openHelp(): void {
  const m = app.modes;
  const service: Node[] = [];
  if (m.urlParams.length) {
    service.push(h("h3", {}, "Link (URL params)"),
      h("table", {}, h("thead", {}, h("tr", {}, ...["Name", "Values", "Default", "Meaning"].map((t) => h("th", {}, t)))),
        h("tbody", {}, ...m.urlParams.map((u) => h("tr", {}, h("td", {}, u.name), h("td", {}, u.values), h("td", {}, u.default), h("td", {}, u.meaning))))),
      copyBlock(`${app.url}?${m.urlParams.map((u) => `${u.name}=${u.default}`).join("&")}`));
  }
  if (m.postMessage) {
    service.push(h("h3", {}, "Embed (iframe)"), copyBlock(`<iframe src="${app.url}?embed=1" title="${app.name}" loading="lazy"></iframe>`),
      p(`Events: ${["ready", "progress", "result", "error"].map((e) => `${m.postMessage?.prefix ?? ""}:${e}`).join(", ")}.`));
  }
  if (m.api) service.push(h("h3", {}, "HTTP API"), copyBlock(`curl ${m.api.baseUrl}/`), p(`OpenAPI: ${m.api.baseUrl}/${m.api.openapi}`));
  if (m.n8n) {
    const copyN8n = h("button", { class: "button button--primary", type: "button" }, "Copy n8n nodes");
    copyN8n.addEventListener("click", () => {
      void fetch("./n8n-workflow.json")
        .then((r) => r.text())
        .then((json) => navigator.clipboard.writeText(json))
        .then(() => { copyN8n.textContent = "Copied ✓ — paste into your n8n canvas"; });
    });
    service.push(h("h3", {}, "n8n"),
      p("Copy the ready-made block (Settings → Request + notes) and paste it into any n8n workflow, then connect the node that carries your file."),
      copyN8n,
      p("Prefer one node? Use an HTTP Request node: POST to the API with JSON body { file: <base64>, filename } — see HTTP API above."));
  }
  if (m.mcp) {
    service.push(h("h3", {}, "MCP (AI agents)"), p("Add the local MCP server to your AI client:"),
      copyBlock(JSON.stringify({ mcpServers: { [app.id]: { command: "npx", args: ["-y", m.mcp.npm] } } }, null, 2)));
    if (m.mcp.url) service.push(p(`Remote MCP: ${m.mcp.url}`));
  }
  service.push(h("h3", {}, "For AI agents"), p(`Agent docs: ${app.url}llms.txt and ${app.url}llms-full.txt`));

  const sections = [
    section("What this app does", p(app.description)),
    section("Quick start", list(app.help.steps, true)),
    ...(app.help.features.length ? [section("Features & options", ...app.help.features.map((f) => h("p", {}, h("strong", {}, `${f.name}: `), f.text)))] : []),
    section("Install as an app", list([
      "Android / Chrome / Edge: open the menu and choose “Install app”.",
      "iPhone / iPad: tap Share, then “Add to Home Screen”, keep “Open as Web App” on, tap Add.",
      "Desktop: use the install icon in the address bar or Menu → Install app.",
    ])),
    section("Use as a service", ...service),
    section("Privacy & your data", p("In the browser everything runs on your device. Settings are stored only in this browser — see Settings → Storage to export or clear them."), h("p", {}, h("a", { href: "./privacy/" }, "Read the full privacy notice"))),
    section("Limits & troubleshooting", list([
      ...(app.limits.maxFileMB ? [`Maximum file size: ${String(app.limits.maxFileMB)} MB.`] : []),
      ...(app.limits.maxItems ? [`Maximum items: ${String(app.limits.maxItems)}.`] : []),
      "Works offline after the first visit. Use a current Chrome, Edge, Safari or Firefox.",
      "Something wrong? Menu → Report a problem.",
    ])),
    section("FAQ", ...app.faq.map((f) => h("div", { class: "faq" }, h("strong", {}, f.q), p(f.a)))),
    section("Contact & support", h("p", {}, h("a", { href: "#report" }, "Report a problem"), " · ", h("a", { href: app.support.buyMeACoffee, target: "_blank", rel: "noopener" }, "Buy me a coffee ☕"))),
  ];
  sections[0]?.setAttribute("open", "");
  const wide = matchMedia("(min-width: 900px)").matches;
  if (wide) sections.forEach((s) => { s.open = true; });
  openDialog("help", "Help", sections);
}
