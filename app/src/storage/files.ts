/**
 * Tier 2 storage — large files in OPFS (Origin Private File System), only inside the folder
 * /{app.id}/ (all micro-apps share the origin). Writes go through a Web Worker with synchronous
 * access handles so the UI never freezes. Reads use File objects (lazy, no copy into memory).
 */
import { app } from "../config.ts";

export class StorageFullError extends Error {
  constructor() { super("Storage is full — export or clear old items."); this.name = "StorageFullError"; }
}

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: () => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./opfs-worker.ts", import.meta.url), { type: "module" });
  worker.addEventListener("message", (e: MessageEvent<{ id: number; ok: boolean; name?: string; message?: string }>) => {
    const p = pending.get(e.data.id);
    if (!p) return;
    pending.delete(e.data.id);
    if (e.data.ok) p.resolve();
    else p.reject(e.data.name === "QuotaExceededError" ? new StorageFullError() : new Error(e.data.message ?? "OPFS error"));
  });
  return worker;
}

function call(msg: { op: "write"; name: string; data: ArrayBuffer } | { op: "remove"; name: string }): Promise<void> {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, dir: app.id, ...msg }, msg.op === "write" ? [msg.data] : []);
  });
}

async function dir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(app.id, { create: true });
}

/** True when OPFS is available (HTTPS + modern browser). Apps must work without it. */
export const filesSupported = (): boolean => "storage" in navigator && "getDirectory" in navigator.storage && typeof Worker !== "undefined";

export const files = {
  /** Save (or replace) a file. Names are flat: "page-1.png". */
  async write(name: string, data: Blob): Promise<void> {
    await call({ op: "write", name, data: await data.arrayBuffer() });
  },
  async read(name: string): Promise<File | null> {
    try { return await (await (await dir()).getFileHandle(name)).getFile(); } catch { return null; }
  },
  async remove(name: string): Promise<void> {
    await call({ op: "remove", name });
  },
  async list(): Promise<string[]> {
    const names: string[] = [];
    for await (const key of (await dir()).keys()) names.push(key);
    return names.sort();
  },
};
