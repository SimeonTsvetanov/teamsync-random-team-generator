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

/** Import limits (security review 2026-11-06): checked before anything is parsed or written. */
const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const MAX_UNZIPPED_BYTES = 200 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 5000;
const MAX_PREF_BYTES = 1024 * 1024;

/** Value checks per pref key; keys without a check are accepted if they are small JSON. Apps add
 *  their own with registerPrefCheck() so a hand-edited export can't break the app. */
const prefChecks = new Map<string, (v: unknown) => boolean>([
  ["theme", (v) => v === "light" || v === "dark"],
  ["lang", (v) => typeof v === "string" && v.length <= 8],
  ["last-seen-version", (v) => typeof v === "string"],
  ["install-dismissed-at", (v) => typeof v === "number"],
  ["report-queue", (v) => Array.isArray(v)],
]);
export function registerPrefCheck(key: string, check: (v: unknown) => boolean): void { prefChecks.set(key, check); }

const isZip = (b: Uint8Array): boolean => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
const safeName = (n: string): boolean => /^[^/\\]{1,200}$/.test(n) && n !== "." && n !== "..";
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Import a JSON or ZIP made by exportAll(); returns how many items were restored.
 * Errors (codes, translated by the UI): IMPORT_TOO_BIG, IMPORT_INVALID, NOT_THIS_APP.
 */
export async function importAll(file: File): Promise<number> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error("IMPORT_TOO_BIG");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let raw: unknown;
  const restored: [string, Uint8Array][] = [];
  try {
    if (isZip(bytes)) {
      const { unzipSync, strFromU8 } = await import("fflate");
      let count = 0, total = 0;
      const zip = unzipSync(bytes, {
        filter: (f) => {
          count += 1; total += f.originalSize;
          if (count > MAX_ZIP_ENTRIES || total > MAX_UNZIPPED_BYTES) throw new Error("IMPORT_TOO_BIG"); // zip bomb guard
          return f.name === "data.json" || (f.name.startsWith("files/") && safeName(f.name.slice(6)));
        },
      });
      raw = JSON.parse(strFromU8(zip["data.json"] ?? new Uint8Array()));
      for (const [path, b] of Object.entries(zip).filter(([name]) => name.startsWith("files/"))) restored.push([path.slice(6), b]);
    } else {
      raw = JSON.parse(new TextDecoder().decode(bytes));
    }
  } catch (e) {
    throw new Error(e instanceof Error && e.message === "IMPORT_TOO_BIG" ? "IMPORT_TOO_BIG" : "IMPORT_INVALID", { cause: e });
  }
  if (!isRecord(raw)) throw new Error("IMPORT_INVALID");
  if (raw["app"] !== app.id) throw new Error("NOT_THIS_APP");
  const prefsIn = raw["prefs"] ?? {};
  const tablesIn = raw["tables"] ?? {};
  if (!isRecord(prefsIn) || !isRecord(tablesIn) || !Object.values(tablesIn).every(Array.isArray)) throw new Error("IMPORT_INVALID");
  let n = 0;
  for (const [k, v] of Object.entries(prefsIn)) {
    const check = prefChecks.get(k) ?? (k.startsWith("draft:") ? isRecord : undefined);
    if (k.length > 100 || JSON.stringify(v).length > MAX_PREF_BYTES || (check && !check(v))) continue; // skip, never break the app
    prefs.set(k, v); n++;
  }
  if (Object.keys(tablesIn).length) n += await (await import("./db.ts")).restoreTables(tablesIn as Record<string, unknown[]>);
  for (const [name, b] of restored) { await files.write(name, new Blob([new Uint8Array(b)])); n++; }
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
