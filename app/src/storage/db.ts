/**
 * Tier 1 storage — structured data in IndexedDB via Dexie (database name = app.id).
 * Bump the version and add an .upgrade() for every schema change; test migrations with old data.
 * Replace the example `items` table with the app's real tables from docs/PLAN.md.
 */
import Dexie, { type EntityTable } from "dexie";
import { app } from "../config.ts";

export interface Item {
  id?: number;
  title: string;
  createdAt: string; // ISO date
}

export const db = new Dexie(app.id) as Dexie & { items: EntityTable<Item, "id"> };

db.version(1).stores({
  items: "++id, createdAt", // index only what you query
});

/** All tables as plain arrays (used by export). */
export async function dumpTables(): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {};
  for (const table of db.tables) out[table.name] = await table.toArray();
  return out;
}

/** Restores tables from an export (adds/overwrites by primary key; never drops other rows). */
export async function restoreTables(tables: Record<string, unknown[]>): Promise<number> {
  let n = 0;
  for (const table of db.tables) {
    const rows = tables[table.name];
    if (Array.isArray(rows)) { await table.bulkPut(rows); n += rows.length; }
  }
  return n;
}
