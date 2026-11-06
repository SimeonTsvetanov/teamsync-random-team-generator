import { app } from "../config.ts";
import credits from "../generated/credits.json";
import { t, text } from "../i18n/index.ts";
import { h } from "./dom.ts";
import { openDialog } from "./dialog.ts";

export function openAbout(): void {
  const link = (href: string, label: string): HTMLAnchorElement => h("a", { href, target: "_blank", rel: "noopener" }, label);
  openDialog("about", t("shell.about.title", { name: app.name }), [
    h("p", {}, text().description),
    h("p", {}, t("shell.about.how")),
    h("p", {}, t("shell.about.builtBy", { author: app.author.name }), link(app.repo, t("shell.about.source")), " · ", ...(app.author.linkedin ? [link(app.author.linkedin, "LinkedIn"), " · "] : []), link(app.support.buyMeACoffee, t("shell.menu.supportMe"))),
    h("p", {}, t("shell.about.version", { version: app.version }), h("a", { href: "#whats-new" }, t("shell.menu.whatsNew"))),
    h("h3", {}, t("shell.about.credits")),
    h("ul", { class: "credits" }, ...credits.map((c) => h("li", {}, `${c.name} — ${c.license}`))),
    ...credits.filter((c): c is typeof c & { notice: string } => "notice" in c && typeof c.notice === "string")
      .map((c) => h("details", { class: "notice" }, h("summary", {}, `${c.name} NOTICE`), h("pre", { class: "code", tabindex: "0" }, c.notice))),
  ]);
}
