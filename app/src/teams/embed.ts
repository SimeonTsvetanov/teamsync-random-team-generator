import * as z from "zod";
import { MAX_TEAMS, MIN_TEAMS } from "@simeonts/teamsync-random-team-generator-core";
import { app } from "../config.ts";

/**
 * iframe contract (forge-engineering → frontend-level1 §6, Help → Embed):
 * out → `teamsync:ready`, `teamsync:result` { teams }, `teamsync:error` { code };
 * in  ← `teamsync:make` { names: string[], teams } from the embedding page only.
 * Messages go only to the parent's own origin (from document.referrer), never "*".
 */
const prefix = app.modes.postMessage?.prefix ?? "teamsync";
const embedded = window.self !== window.top;
const parentOrigin = ((): string | null => {
  try { return document.referrer ? new URL(document.referrer).origin : null; } catch { return null; }
})();

const MakeMessage = z.object({
  type: z.literal(`${prefix}:make`),
  names: z.array(z.string().max(100)).max(1000),
  teams: z.int().min(MIN_TEAMS).max(MAX_TEAMS),
});

export function postToParent(event: "ready" | "result" | "error", data: Record<string, unknown> = {}): void {
  if (!embedded || !parentOrigin) return;
  window.parent.postMessage({ type: `${prefix}:${event}`, ...data }, parentOrigin);
}

/** Listens for `teamsync:make` from the embedding page and announces `ready`. */
export function initEmbed(onMake: (names: string[], teams: number) => void): void {
  if (!embedded || !parentOrigin) return;
  window.addEventListener("message", (e: MessageEvent<unknown>) => {
    if (e.origin !== parentOrigin || e.source !== window.parent) return;
    if (JSON.stringify(e.data ?? null).length > 120_000) return; // payload cap
    const msg = MakeMessage.safeParse(e.data);
    if (msg.success) onMake(msg.data.names, msg.data.teams);
  });
  postToParent("ready");
}
