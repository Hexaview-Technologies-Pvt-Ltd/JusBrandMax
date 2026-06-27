import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ClaudeProvider, AskResult } from "@jusbrandmax/engine";
import { dispatch, TOOLS } from "./server.js";
import type { ToolDeps } from "./tools.js";

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
    historyPath: join(mkdtempSync(join(tmpdir(), "jbm-srv-")), "history.sqlite"),
    now: () => "2026-06-27T00:00:00Z",
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
describe("MCP dispatch (zero-dep JSON-RPC)", () => {
  it("handles initialize", async () => {
    const res = (await dispatch(
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } },
      deps(),
    )) as any;
    expect(res.result.serverInfo.name).toBe("jusbrandmax");
    expect(res.result.capabilities.tools).toBeDefined();
  });

  it("lists all tools", async () => {
    const res = (await dispatch({ jsonrpc: "2.0", id: 2, method: "tools/list" }, deps())) as any;
    expect(res.result.tools.map((t: { name: string }) => t.name).sort()).toEqual([
      "get_history",
      "list_competitors",
      "list_packs",
      "run_brand_report",
    ]);
    expect(TOOLS).toHaveLength(4);
  });

  it("list_packs returns the category packs", async () => {
    const res = (await dispatch(
      { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "list_packs", arguments: {} } },
      deps(),
    )) as any;
    const out = JSON.parse(res.result.content[0].text);
    expect(out.packs.map((p: { id: string }) => p.id)).toContain("ecommerce");
  });

  it("returns null for the initialized notification", async () => {
    expect(await dispatch({ jsonrpc: "2.0", method: "notifications/initialized" }, deps())).toBeNull();
  });

  it("runs run_brand_report via tools/call", async () => {
    const res = (await dispatch(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "run_brand_report", arguments: { brand: "Acme", prompts: ["best crm?"], competitors: ["Beta"], samples: 1 } },
      },
      deps(),
    )) as any;
    const report = JSON.parse(res.result.content[0].text);
    expect(report.brand).toBe("Acme");
    expect(report.engine).toBe("Claude");
  });

  it("errors on unknown method", async () => {
    const res = (await dispatch({ jsonrpc: "2.0", id: 4, method: "nope" }, deps())) as any;
    expect(res.error.code).toBe(-32601);
  });
});
