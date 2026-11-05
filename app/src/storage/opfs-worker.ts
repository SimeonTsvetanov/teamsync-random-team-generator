/**
 * OPFS worker: big reads/writes with synchronous access handles (fast, off the main thread).
 * Sync access handles exist only in workers (forge-engineering → browser-storage §5).
 */
type Req =
  | { id: number; op: "write"; dir: string; name: string; data: ArrayBuffer }
  | { id: number; op: "remove"; dir: string; name: string };

// Minimal worker-only types (the app tsconfig uses DOM libs; mixing in WebWorker libs conflicts).
interface SyncHandle { truncate(size: number): void; write(data: Uint8Array, opts: { at: number }): number; flush(): void; close(): void }
interface SyncFileHandle { createSyncAccessHandle(): Promise<SyncHandle> }
const post = (msg: unknown): void => { (self as unknown as { postMessage: (m: unknown) => void }).postMessage(msg); };

async function folder(dir: string): Promise<FileSystemDirectoryHandle> {
  let d = await navigator.storage.getDirectory();
  for (const part of dir.split("/").filter(Boolean)) d = await d.getDirectoryHandle(part, { create: true });
  return d;
}

self.addEventListener("message", (e: MessageEvent<Req>) => {
  const r = e.data;
  void (async () => {
    try {
      const d = await folder(r.dir);
      if (r.op === "remove") {
        await d.removeEntry(r.name);
      } else {
        const fh = await d.getFileHandle(r.name, { create: true });
        const handle = await (fh as unknown as SyncFileHandle).createSyncAccessHandle();
        try {
          handle.truncate(0);
          handle.write(new Uint8Array(r.data), { at: 0 });
          handle.flush();
        } finally {
          handle.close();
        }
      }
      post({ id: r.id, ok: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "Error";
      post({ id: r.id, ok: false, name, message: err instanceof Error ? err.message : String(err) });
    }
  })();
});
