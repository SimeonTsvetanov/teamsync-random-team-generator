import { app } from "../config.ts";
import credits from "../generated/credits.json";
import { t, text } from "../i18n/index.ts";
import { h } from "./dom.ts";
import { openDialog } from "./dialog.ts";

const KINDS = ["font", "icons", "translations", "validation", "database", "zip", "mcp", "pdf"] as const;
type Kind = (typeof KINDS)[number];
const isKind = (k: string): k is Kind => (KINDS as readonly string[]).includes(k);

/** About (APP-STANDARD §2): what it is, who made it (links), version, and credits in plain words. */
export function openAbout(): void {
  const link = (href: string, label: string): HTMLAnchorElement => h("a", { href, target: "_blank", rel: "noopener" }, label);
  // About the PERSON: GitHub profile, LinkedIn, Support. The app's own code is "Source code" below.
  const people = [link(app.author.github ?? "https://github.com/SimeonTsvetanov", "GitHub"), ...(app.author.linkedin ? [link(app.author.linkedin, "LinkedIn")] : []), link(app.support.buyMeACoffee, t("shell.menu.supportMe"))];
  const dot = (): Text => document.createTextNode(" · ");
  openDialog("about", t("shell.about.title", { name: app.name }), [
    h("p", {}, text().description),
    h("p", {}, t("shell.about.builtBy", { author: app.author.name }), ...people.flatMap((a, i) => (i ? [dot(), a] : [a]))),
    h("p", { class: "hint" }, t("shell.about.version", { version: app.version }), link(app.repo, t("shell.about.source")), " · ", h("a", { href: "#whats-new" }, t("shell.menu.whatsNew"))),
    h("h3", {}, t("shell.about.credits")),
    // Full licence texts (MIT/Apache-2.0/OFL require them with every copy — legal-pages §5).
    h("p", { class: "hint" }, h("a", { href: "./third-party-licenses.txt", target: "_blank", rel: "noopener" }, t("shell.about.licenses"))),
    h("ul", { class: "credits" }, ...credits.map((c) => h("li", {},
      h("a", { href: c.url, target: "_blank", rel: "noopener" }, c.title),
      ` — ${isKind(c.kind) ? t(`shell.credit.${c.kind}`) : c.what}`,
      h("span", { class: "hint" }, ` · ${c.license}`)))),
    ...credits.filter((c): c is typeof c & { notice: string } => "notice" in c && typeof c.notice === "string")
      .map((c) => h("details", { class: "notice" }, h("summary", {}, t("shell.about.notice", { name: c.title })), h("pre", { class: "code", tabindex: "0", lang: "en" }, c.notice))),
  ]);
}
