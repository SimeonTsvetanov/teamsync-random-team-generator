import { app } from "../config.ts";

export interface CrashReport { readonly message: string; readonly stack: string; readonly lastAction: string }

/** Sends an error report to the shared microapp-feedback webhook (forge-app-shell → feedback-reporting). */
export async function sendErrorReport(report: CrashReport): Promise<{ issue: number }> {
  const webhook: string | null = app.feedback.webhook;
  if (!webhook) throw new Error("Feedback webhook not configured");
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "crash", app: app.id, version: app.version, ...report }),
  });
  if (!res.ok) throw new Error(`Report failed: ${String(res.status)}`);
  return (await res.json()) as { issue: number };
}
