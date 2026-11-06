import { app } from "../config.ts";
import { prefs } from "../storage/index.ts";
import { h } from "./dom.ts";
import { openDialog } from "./dialog.ts";
import { confirmAction } from "./confirm.ts";
import { t } from "../i18n/index.ts";

const diagnostics = (): Record<string, string> => ({
  app: `${app.name} ${app.version}`,
  browser: navigator.userAgent,
  screen: `${String(screen.width)}×${String(screen.height)}`,
  display: matchMedia("(display-mode: standalone)").matches ? "standalone" : window.self !== window.top ? "embed" : "browser",
  language: navigator.language,
  time: new Date().toISOString(),
});

/** Report a problem (APP-STANDARD §7.1): send via the shared webhook, or open a pre-filled GitHub issue. */
export function openReport(): void {
  const type = h("select", { name: "type" }, ...(["Problem", "Idea", "Question"] as const).map((v) => h("option", { value: v }, t(`shell.report.type${v}`))));
  const title = h("input", { name: "title", required: "", maxlength: "120", autocomplete: "off" });
  const text = h("textarea", { name: "text", required: "", rows: "5", maxlength: "4000" });
  const email = h("input", { name: "email", type: "email", autocomplete: "email", placeholder: "you@example.com…" });
  const honeypot = h("input", { name: "website", tabindex: "-1", autocomplete: "off" });
  const trap = h("div", { class: "honeypot", "aria-hidden": "true" }, honeypot); // bots fill it, people never see it
  const diag = diagnostics();
  const checks = Object.entries(diag).map(([k, v]) => {
    const box = h("input", { type: "checkbox", name: `d-${k}` });
    box.checked = true;
    return { k, v, box, row: h("label", { class: "check" }, box, `${k}: ${v}`) };
  });
  const status = h("p", { class: "status", "aria-live": "polite" });
  const chosen = (): Record<string, string> => Object.fromEntries(checks.filter((c) => c.box.checked).map((c) => [c.k, c.v]));
  const body = (): string => `${text.value}\n\n---\n${Object.entries(chosen()).map(([k, v]) => `${k}: ${v}`).join("\n")}`;
  const github = h("a", { class: "button", target: "_blank", rel: "noopener", href: "#" }, t("shell.report.github"));
  github.addEventListener("click", () => {
    github.href = `${app.repo}/issues/new?template=${type.value === "Idea" ? "feature_request" : "bug_report"}.yml&title=${encodeURIComponent(`[${type.value}] ${title.value}`)}&body=${encodeURIComponent(body().slice(0, 6000))}`;
  });
  const send = h("button", { class: "button button--primary", type: "submit" }, t("shell.report.send"));
  if (!app.feedback.webhook) send.hidden = true;
  const form = h("form", { class: "form" },
    h("p", { class: "hint" }, t("shell.report.public")),
    h("label", {}, t("shell.report.type"), type), h("label", {}, t("shell.report.shortTitle"), title), h("label", {}, t("shell.report.text"), text),
    h("label", {}, t("shell.report.email"), email), trap,
    h("details", { class: "diag" }, h("summary", {}, t("shell.report.diagnosticsSummary", { count: checks.length })),
      h("fieldset", {}, h("legend", { class: "hint" }, t("shell.report.diagnostics")), ...checks.map((c) => c.row))),
    h("div", { class: "actions" }, send, github), status);
  let sent = false; // queued or delivered → closing needs no confirmation
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const webhook = app.feedback.webhook;
    if (!webhook) return;
    const payload = { app: app.id, repo: app.repo, version: app.version, type: type.value.toLowerCase(), title: title.value, description: text.value, email: email.value, diagnostics: chosen(), website: honeypot.value };
    if (!navigator.onLine) {
      prefs.set("report-queue", [...prefs.get<unknown[]>("report-queue", []), payload]);
      status.textContent = t("shell.report.offline");
      sent = true;
      return;
    }
    status.textContent = t("shell.report.sending");
    void fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        const { issue } = (await r.json()) as { issue: number };
        status.textContent = t("shell.report.sent", { issue });
        sent = true;
      })
      .catch(() => { status.textContent = t("shell.report.failed"); });
  });
  // Typed text is never lost silently: closing with unsent input asks first (ui-patterns §4).
  openDialog("report", t("shell.report.title"), [form], {
    beforeClose: () => sent || (!title.value.trim() && !text.value.trim()) || confirmAction({
      title: t("shell.report.discardTitle"), message: t("shell.report.discardMessage"),
      confirm: t("shell.report.discardConfirm"), cancel: t("shell.report.keepEditing"),
    }),
  });
}

/** Sends queued offline reports on start / when back online. */
export function flushReportQueue(): void {
  const webhook = app.feedback.webhook;
  const queue = prefs.get<unknown[]>("report-queue", []);
  if (!webhook || !queue.length || !navigator.onLine) return;
  prefs.remove("report-queue");
  for (const item of queue) void fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
}
