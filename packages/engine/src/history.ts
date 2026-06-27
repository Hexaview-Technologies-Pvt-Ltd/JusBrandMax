/**
 * Local-first run history, backed by SQLite.
 *
 * Uses Node's built-in `node:sqlite` driver rather than the native
 * `better-sqlite3` add-on — it is genuinely SQLite with zero native-build
 * dependency, which keeps jusBrandMax trivially self-hostable. History never
 * leaves the user's machine.
 */
import { createRequire } from "node:module";
import type { BrandReport } from "./report.js";

// Load via createRequire rather than a static `import` so bundlers (e.g. Vitest's
// Vite layer) don't try to resolve the not-yet-recognized `node:sqlite` builtin.
const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire("node:sqlite") as typeof import("node:sqlite");

export interface HistoryStore {
  save(report: BrandReport): void;
  /** Most recent report for a brand, or null. */
  latest(brand: string): BrandReport | null;
  /** Second-most-recent report for a brand (the one before `latest`), or null. */
  previous(brand: string): BrandReport | null;
  /** All reports for a brand, newest first. */
  list(brand: string): BrandReport[];
  close(): void;
}

export function openHistory(path: string): HistoryStore {
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_runs_brand ON runs(brand, id DESC);
  `);

  const insert = db.prepare("INSERT INTO runs(brand, generated_at, json) VALUES(?, ?, ?)");
  const selectByBrand = db.prepare(
    "SELECT json FROM runs WHERE brand = ? ORDER BY id DESC LIMIT ? OFFSET ?",
  );
  const selectAll = db.prepare("SELECT json FROM runs WHERE brand = ? ORDER BY id DESC");

  const parse = (row: unknown): BrandReport => JSON.parse((row as { json: string }).json);

  return {
    save(report) {
      insert.run(report.brand, report.generatedAt, JSON.stringify(report));
    },
    latest(brand) {
      const row = selectByBrand.get(brand, 1, 0);
      return row ? parse(row) : null;
    },
    previous(brand) {
      const row = selectByBrand.get(brand, 1, 1);
      return row ? parse(row) : null;
    },
    list(brand) {
      return selectAll.all(brand).map(parse);
    },
    close() {
      db.close();
    },
  };
}

export interface ReportDeltas {
  visibility: number;
  shareOfVoice: number;
  prominence: number;
  sentimentNet: number;
  accuracy: number;
  overall: number;
}

/** Current minus previous, per dimension. Null when there is no prior run. */
export function computeDeltas(current: BrandReport, previous: BrandReport | null): ReportDeltas | null {
  if (!previous) return null;
  const c = current.dimensions;
  const p = previous.dimensions;
  return {
    visibility: c.presence.visibility - p.presence.visibility,
    shareOfVoice: c.shareOfVoice.brandShare - p.shareOfVoice.brandShare,
    prominence: c.prominence.firstMentionRate - p.prominence.firstMentionRate,
    sentimentNet: c.sentiment.net - p.sentiment.net,
    accuracy: c.accuracy.accuracy - p.accuracy.accuracy,
    overall: current.overall - previous.overall,
  };
}
