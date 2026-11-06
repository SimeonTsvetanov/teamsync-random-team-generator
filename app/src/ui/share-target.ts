import { app } from "../config.ts";

export interface SharedContent { readonly title: string; readonly text: string; readonly url: string }

/**
 * Receive content shared from other apps (Android/Chrome "Share → <app>") — enabled by
 * `app.config.modes.shareTarget: true`, which adds a GET `share_target` to the manifest
 * (`?share-target=1&title=…&text=…&url=…`). The params are read once and removed from the
 * address bar. iOS has no share target; files need a POST target + custom service worker
 * (forge-pwa → pwa §4) — not in the template.
 */
let pending: SharedContent | null = null;
const listeners: ((c: SharedContent) => void)[] = [];

export function initShareTarget(): void {
  if (!app.modes.shareTarget) return;
  const q = new URLSearchParams(location.search);
  if (!q.has("share-target")) return;
  pending = { title: q.get("title") ?? "", text: q.get("text") ?? "", url: q.get("url") ?? "" };
  for (const k of ["share-target", "title", "text", "url"]) q.delete(k);
  history.replaceState(null, "", `${location.pathname}${q.size ? `?${q.toString()}` : ""}${location.hash}`);
}

/** App code: handle shared content (called at once if it arrived before the listener). */
export function onShared(cb: (c: SharedContent) => void): void {
  listeners.push(cb);
  if (pending) { const c = pending; pending = null; cb(c); }
}
