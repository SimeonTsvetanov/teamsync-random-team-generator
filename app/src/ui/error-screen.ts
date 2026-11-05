/**
 * src/ui/error-screen.ts — the in-app "Something went wrong" screen (APP-STANDARD §15.1 item 8).
 * Level 1: call installErrorScreen() once in main.ts. Level 2: render the same markup from the
 * app-level error boundary. Styled by error-page.css (tokens only). No innerHTML with data.
 * Template: forge-app-shell 0.2.0 (2026-11-05).
 */
import { app } from "../config.ts";
import { sendErrorReport } from "./feedback.ts"; // POSTs { type: "crash", … } to the feedback webhook

let shown = false;

/** Registers global handlers; the screen appears only for unexpected errors. */
export function installErrorScreen(): void {
  window.addEventListener("error", (e) => {
    show(e.error instanceof Error ? e.error : new Error(e.message));
  });
  window.addEventListener("unhandledrejection", (e) => {
    show(toError(e.reason));
  });
}

function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason));
}

/** Shows the full-screen error view. Exported for error boundaries and manual use. */
export function show(error: Error, lastAction = getLastAction()): void {
  if (shown) return;
  shown = true;
  const details = [
    `${app.name} ${app.version}`,
    `Error: ${error.name}: ${error.message}`,
    `Last action: ${lastAction}`,
    `Browser: ${navigator.userAgent}`,
    `Display: ${matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser"}`,
    `Time: ${new Date().toISOString()}`,
    "",
    error.stack ?? "(no stack)",
  ].join("\n");

  const root = el("main", { className: "es", role: "alert", "aria-labelledby": "es-title" });
  const icon = el("div", { className: "es-icon", "aria-hidden": "true" });
  icon.textContent = "!";
  const title = el("h1", { className: "es-title", id: "es-title", tabIndex: -1 });
  title.textContent = "Something went wrong";
  const text = el("p", { className: "es-text" });
  text.textContent =
    "The app hit an unexpected error. Your files and saved data are safe on this device. Reload to continue — if it happens again, send us a report.";
  const chip = el("p", { className: "es-chip" });
  chip.textContent = error.name === "Error" ? "Unexpected error" : error.name;

  const actions = el("div", { className: "es-actions" });
  const reload = button("Reload", true, () => {
    location.reload();
  });
  const status = el("p", { className: "es-status", "aria-live": "polite" });
  const report = button("Send error report", false, async () => {
    report.disabled = true;
    status.textContent = "Sending…";
    try {
      const { issue } = await sendErrorReport({ message: error.message, stack: error.stack ?? "", lastAction });
      status.textContent = `Thanks! Report #${String(issue)} sent ✓`;
    } catch {
      status.textContent = "Couldn't send right now. Copy the details and use Report a problem later.";
      report.disabled = false;
    }
  });
  const copy = button("Copy details", false, async () => {
    try { await navigator.clipboard.writeText(details); copy.textContent = "Copied ✓"; }
    catch { copy.textContent = "Select the text below to copy"; }
    setTimeout(() => {
      copy.textContent = "Copy details";
    }, 2000);
  });
  actions.append(reload, report, copy);

  const det = el("details", { className: "es-details" });
  const sum = el("summary");
  sum.textContent = "Technical details";
  const pre = el("pre");
  pre.textContent = details;
  det.append(sum, pre);

  root.append(icon, title, text, chip, actions, status, det);
  document.body.append(root);
  document.title = `Error · ${app.name}`;
  title.focus();
}

function button(label: string, primary: boolean, onClick: () => void | Promise<void>): HTMLButtonElement {
  const b = el("button", { className: `ep-button${primary ? " ep-button--primary" : ""}`, type: "button" });
  b.textContent = label;
  b.addEventListener("click", () => {
    void onClick();
  });
  return b;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, string | number> = {}): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "className") node.className = String(v);
    else if (k === "tabIndex") node.tabIndex = Number(v);
    else node.setAttribute(k, String(v));
  }
  return node;
}

function getLastAction(): string {
  return document.documentElement.dataset["lastAction"] ?? "unknown";
}
