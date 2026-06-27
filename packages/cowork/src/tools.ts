/**
 * Cowork tool handlers — the logic behind the MCP tools, kept transport-free so
 * they unit-test without spinning up a stdio server. The MCP wiring in
 * `server.ts` is a thin adapter over these.
 */
import {
  resolveBrandConfig,
  runReport,
  openHistory,
  createClaudeProvider,
  listPacks,
  getPack,
  type ClaudeProvider,
  type BrandReport,
  type LeaderboardEntry,
} from "@jusbrandmax/engine";

export interface ToolDeps {
  makeProvider: (apiKey?: string) => ClaudeProvider;
  env: Record<string, string | undefined>;
  historyPath: string;
  now?: () => string;
}

export function defaultToolDeps(): ToolDeps {
  return {
    makeProvider: (k?: string) => createClaudeProvider(k ? { apiKey: k } : {}),
    env: process.env,
    historyPath: process.env["JUSBRANDMAX_DB"] ?? "jusbrandmax-history.sqlite",
  };
}

export interface RunBrandReportArgs {
  brand: string;
  prompts: string[];
  indirectPrompts?: string[];
  competitors?: string[];
  aliases?: string[];
  model?: string;
  samples?: number;
  mode?: "quick" | "standard" | "detailed";
  /** Persist to local history (default true). */
  persist?: boolean;
}

export async function runBrandReportTool(
  args: RunBrandReportArgs,
  deps: ToolDeps,
): Promise<BrandReport> {
  const config = resolveBrandConfig({
    brand: args.brand,
    prompts: args.prompts,
    ...(args.indirectPrompts ? { indirectPrompts: args.indirectPrompts } : {}),
    ...(args.competitors ? { competitors: args.competitors } : {}),
    ...(args.aliases ? { aliases: args.aliases } : {}),
    ...(args.model ? { model: args.model } : {}),
    ...(args.samples ? { samples: args.samples } : {}),
    ...(args.mode ? { mode: args.mode } : {}),
  });
  const provider = deps.makeProvider(deps.env["ANTHROPIC_API_KEY"]);
  const report = await runReport(provider, config, deps.now ? { now: deps.now() } : {});
  if (args.persist !== false) {
    const store = openHistory(deps.historyPath);
    store.save(report);
    store.close();
  }
  return report;
}

export interface HistoryEntry {
  generatedAt: string;
  overall: number;
  visibility: number;
  shareOfVoice: number;
}

export function getHistoryTool(
  args: { brand: string },
  deps: ToolDeps,
): { brand: string; runs: HistoryEntry[] } {
  const store = openHistory(deps.historyPath);
  const runs = store.list(args.brand).map((r) => ({
    generatedAt: r.generatedAt,
    overall: r.overall,
    visibility: r.dimensions.presence.visibility,
    shareOfVoice: r.dimensions.shareOfVoice.brandShare,
  }));
  store.close();
  return { brand: args.brand, runs };
}

export function listCompetitorsTool(
  args: { brand: string },
  deps: ToolDeps,
): { brand: string; leaderboard: LeaderboardEntry[] } {
  const store = openHistory(deps.historyPath);
  const latest = store.latest(args.brand);
  store.close();
  return { brand: args.brand, leaderboard: latest?.leaderboard ?? [] };
}

export function listPacksTool(args: { category?: string } = {}): unknown {
  if (args.category) {
    const pack = getPack(args.category);
    return pack ?? { error: `Unknown category '${args.category}'.`, available: listPacks().map((p) => p.id) };
  }
  return { packs: listPacks() };
}
