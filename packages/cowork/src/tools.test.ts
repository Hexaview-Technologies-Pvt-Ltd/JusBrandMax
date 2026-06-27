import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ClaudeProvider, AskResult } from "@jusbrandmax/engine";
import {
  runBrandReportTool,
  getHistoryTool,
  listCompetitorsTool,
  type ToolDeps,
} from "./tools.js";

function fakeProvider(): ClaudeProvider {
  return {
    ask: async (prompt, opts): Promise<AskResult> => {
      const mk = (t: string): AskResult => ({
        prompt,
        model: opts.model,
        responses: Array.from({ length: opts.samples ?? 1 }, () => t),
      });
      if (opts.system?.includes("portrays")) return mk('{"label":"positive","rationale":"good"}');
      if (opts.system?.includes("fact-check")) return mk('{"claims":[]}');
      return mk("Acme is the best CRM, ahead of Beta.");
    },
  };
}

function deps(): ToolDeps {
  return {
    makeProvider: fakeProvider,
    env: {},
    historyPath: join(mkdtempSync(join(tmpdir(), "jbm-cw-")), "history.sqlite"),
    now: () => "2026-06-27T00:00:00Z",
  };
}

describe("runBrandReportTool", () => {
  it("produces a report and persists history", async () => {
    const d = deps();
    const report = await runBrandReportTool(
      { brand: "Acme", prompts: ["best crm?"], competitors: ["Beta"], samples: 2 },
      d,
    );
    expect(report.brand).toBe("Acme");
    expect(report.dimensions.presence.visibility).toBe(1);

    // history + competitor tools read the persisted run
    expect(getHistoryTool({ brand: "Acme" }, d).runs).toHaveLength(1);
    const board = listCompetitorsTool({ brand: "Acme" }, d).leaderboard;
    expect(board.find((e) => e.isBrand)?.name).toBe("Acme");
  });

  it("can skip persistence", async () => {
    const d = deps();
    await runBrandReportTool({ brand: "Acme", prompts: ["best crm?"], persist: false }, d);
    expect(getHistoryTool({ brand: "Acme" }, d).runs).toHaveLength(0);
  });
});
