/**
 * The shared storage module (forge-engineering → browser-storage). Apps never call localStorage,
 * indexedDB, caches or navigator.storage directly. Everything is namespaced by app.id because all
 * micro-apps share the origin simeontsvetanov.github.io.
 */
import { app } from "../config.ts";

const PREFIX = `${app.id}:v1:`;
const memory = new Map<string, string>(); // fallback when storage is blocked (private mode)

function safeGet(key: string): string | null {
  try { return localStorage.getItem(PREFIX + key); } catch { return memory.get(key) ?? null; }
}

/** Tier 0 preferences (strings/JSON, small). */
export const prefs = {
  get<T>(key: string, fallback: T): T {
    const raw = safeGet(key);
    if (raw === null) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  },
  set(key: string, value: unknown): boolean {
    const raw = JSON.stringify(value);
    try { localStorage.setItem(PREFIX + key, raw); return true; } catch { memory.set(key, raw); return false; }
  },
  remove(key: string): void {
    try { localStorage.removeItem(PREFIX + key); } catch { /* blocked */ }
    memory.delete(key);
  },
  keys(): string[] {
    try {
      return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length));
    } catch { return [...memory.keys()]; }
  },
};

/** Space used / available for this origin (shared by all apps on it). */
export async function estimate(): Promise<{ usage: number; quota: number } | null> {
  if (!("storage" in navigator)) return null;
  const e = await navigator.storage.estimate();
  return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
}

export async function isPersisted(): Promise<boolean> {
  return "storage" in navigator ? navigator.storage.persisted() : false;
}

export async function requestPersist(): Promise<boolean> {
  return "storage" in navigator ? navigator.storage.persist() : false;
}

// Tier 1 (Dexie) is imported directly by apps that need it: `import { db } from "./storage/db.ts"`.
// Here it loads lazily, only if this app's database exists — apps without it never download Dexie.
export { files, filesSupported, StorageFullError } from "./files.ts";
import { files, filesSupported } from "./files.ts";

async function hasDb(): Promise<boolean> {
  try { return (await indexedDB.databases()).some((d) => d.name === app.id); } catch { return false; }
}

interface ExportData { app: string; schemaVersion: number; exportedAt: string; prefs: Record<string, unknown>; tables: Record<string, unknown[]>; files: string[] }

/** Export my data: JSON when there are no files, otherwise a ZIP (data.json + files/). */
export async function exportAll(): Promise<Blob> {
  const prefsData: Record<string, unknown> = {};
  for (const k of prefs.keys()) prefsData[k] = prefs.get<unknown>(k, null);
  const names = filesSupported() ? await files.list().catch(() => []) : [];
  const data: ExportData = { app: app.id, schemaVersion: 1, exportedAt: new Date().toISOString(), prefs: prefsData, tables: (await hasDb()) ? await (await import("./db.ts")).dumpTables() : {}, files: names };
  const json = JSON.stringify(data, null, 2);
  if (!names.length) return new Blob([json], { type: "application/json" });
  const { zipSync, strToU8 } = await import("fflate");
  const entries: Record<string, Uint8Array> = { "data.json": strToU8(json) };
  for (const name of names) {
    const f = await files.read(name);
    if (f) entries[`files/${name}`] = new Uint8Array(await f.arrayBuffer());
  }
  return new Blob([new Uint8Array(zipSync(entries))], { type: "application/zip" });
}

/** Import a JSON or ZIP made by exportAll(); returns how many items were restored. */
export async function importAll(file: File): Promise<number> {
  let data: Partial<ExportData>;
  const restored: [string, Uint8Array][] = [];
  if (file.name.endsWith(".zip")) {
    const { unzipSync, strFromU8 } = await import("fflate");
    const zip = unzipSync(new Uint8Array(await file.arrayBuffer()));
    data = JSON.parse(strFromU8(zip["data.json"] ?? new Uint8Array())) as Partial<ExportData>;
    for (const [path, bytes] of Object.entries(zip)) if (path.startsWith("files/")) restored.push([path.slice(6), bytes]);
  } else {
    data = JSON.parse(await file.text()) as Partial<ExportData>;
  }
  if (data.app !== app.id) throw new Error("NOT_THIS_APP"); // code; the UI shows a translated message
  let n = 0;
  for (const [k, v] of Object.entries(data.prefs ?? {})) { prefs.set(k, v); n++; }
  if (data.tables && Object.keys(data.tables).length) n += await (await import("./db.ts")).restoreTables(data.tables);
  for (const [name, bytes] of restored) { await files.write(name, new Blob([new Uint8Array(bytes)])); n++; }
  return n;
}

/** Clear my data — only this app's namespace (prefs, IndexedDB db, caches, OPFS folder). */
export async function clearAll(): Promise<void> {
  for (const k of prefs.keys()) prefs.remove(k);
  try { indexedDB.deleteDatabase(app.id); } catch { /* unavailable */ }
  try {
    for (const name of await caches.keys()) if (name.startsWith(app.id)) await caches.delete(name);
  } catch { /* unavailable */ }
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(app.id, { recursive: true });
  } catch { /* no folder */ }
}

/** After the first meaningful save: ask once to keep data on this device (APP-STANDARD §6.1 rule 7). */
export async function offerPersistOnce(ask: (keep: () => Promise<boolean>) => void): Promise<void> {
  if (prefs.get<boolean>("persist-offered", false) || (await isPersisted())) return;
  prefs.set("persist-offered", true);
  ask(requestPersist);
}
