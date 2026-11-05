import { app } from "../config.ts";
import credits from "../generated/credits.json";
import { h } from "./dom.ts";
import { openDialog } from "./dialog.ts";

export function openAbout(): void {
  const link = (href: string, text: string): HTMLAnchorElement => h("a", { href, target: "_blank", rel: "noopener" }, text);
  openDialog("about", `About ${app.name}`, [
    h("p", {}, app.description),
    h("p", {}, "How it works: everything runs in your browser on your device."),
    h("p", {}, `Built by ${app.author.name} (Moni) · `, link(app.repo, "Source on GitHub"), " · ", link(app.support.buyMeACoffee, "Support ☕")),
    h("p", {}, `Version ${app.version} · MIT licence · `, h("a", { href: "#whats-new" }, "What's new")),
    h("h3", {}, "Credits"),
    h("ul", { class: "credits" }, ...credits.map((c) => h("li", {}, `${c.name} — ${c.license}`))),
  ]);
}
