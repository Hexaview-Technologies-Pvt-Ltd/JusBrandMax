import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ClaudeProvider, AskResult } from "@jusbrandmax/engine";
import { parseArgs, runCli } from "./cli.js";

describe("parseArgs", () => {
  it("parses command, value flags, and boolean flags", () => {
    const p = parseArgs(["report", "--config", "x.json", "--footer"]);
    expect(p.command).toBe("report");
    expect(p.flags["config"]).toBe("x.json");
    expect(p.flags["footer"]).toBe(true);
  });

  it("defaults to help with no args", () => {
    expect(parseArgs([]).command).toBe("help");
  });
});

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
      return mk("Acme is the best CRM.");
    },
  };
}

function collector() {
  const lines: string[] = [];
  return { out: (s: string) => lines.push(s), text: () => lines.join("\n") };
}

describe("runCli", () => {
  it("init writes a sample config, refuses to overwrite", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "jbm-"));
    const log = collector();
    expect(await runCli(["init"], { cwd, stdout: log.out, stderr: log.out })).toBe(0);
    expect(existsSync(join(cwd, "brand.config.json"))).toBe(true);
    // second init refuses
    expect(await runCli(["init"], { cwd, stdout: log.out, stderr: log.out })).toBe(1);
  });

  it("lists packs and seeds a config from a category", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "jbm-"));
    const log = collector();
    expect(await runCli(["packs"], { cwd, stdout: log.out, stderr: log.out })).toBe(0);
    expect(log.text()).toContain("ecommerce");

    expect(await runCli(["init", "--category", "travel"], { cwd, stdout: () => {}, stderr: () => {} })).toBe(0);
    const cfg = JSON.parse(readFileSync(join(cwd, "brand.config.json"), "utf8")) as { prompts: string[] };
    expect(cfg.prompts.join(" ")).toMatch(/destination/);

    const cwd2 = mkdtempSync(join(tmpdir(), "jbm-"));
    expect(await runCli(["init", "--category", "nope"], { cwd: cwd2, stdout: () => {}, stderr: () => {} })).toBe(1);
  });

  it("report errors without a config", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "jbm-"));
    const log = collector();
    const code = await runCli(["report"], { cwd, stdout: log.out, stderr: log.out, makeProvider: fakeProvider });
    expect(code).toBe(1);
    expect(log.text()).toMatch(/init/);
  });

  it("onboards from --brand, writes a badge, drafts a fix, and diffs two runs", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "jbm-"));
    const rich = (): ClaudeProvider => ({
      ask: async (prompt, opts): Promise<AskResult> => {
        const mk = (t: string): AskResult => ({
          prompt,
          model: opts.model,
          responses: Array.from({ length: opts.samples ?? 1 }, () => t),
        });
        const sys = opts.system ?? "";
        if (sys.includes("set up a brand-visibility audit"))
          return mk('{"prompts":["best crm?"],"indirectPrompts":["how do I track leads?"],"competitors":["Globex","Initech"]}');
        if (sys.includes("brand content strategist")) return mk("# Lead tracking guide\nAcme helps...");
        if (sys.includes("portrays")) return mk('{"label":"positive","rationale":"good"}');
        if (sys.includes("fact-check")) return mk('{"claims":[]}');
        if (prompt.includes("track leads")) return mk("Globex and Initech can help with that."); // indirect → brand absent
        return mk("Acme is the best CRM, ahead of Globex.");
      },
    });
    const base = { cwd, stdout: () => {}, stderr: () => {}, makeProvider: rich, env: { ANTHROPIC_API_KEY: "x" } };

    await runCli(["init", "--brand", "Acme", "--about", "a CRM"], base);
    const cfg = JSON.parse(readFileSync(join(cwd, "brand.config.json"), "utf8")) as { brand: string; prompts: string[] };
    expect(cfg.brand).toBe("Acme");
    expect(cfg.prompts).toContain("best crm?");

    await runCli(["report", "--badge", "b.svg"], { ...base, now: () => "t1" });
    expect(readFileSync(join(cwd, "b.svg"), "utf8")).toContain("<svg");

    await runCli(["report"], { ...base, now: () => "t2" }); // second run for diff

    await runCli(["fix"], base);
    expect(readFileSync(join(cwd, "brand-fix.md"), "utf8")).toContain("Lead tracking guide");

    const diffOut: string[] = [];
    await runCli(["diff"], { cwd, stdout: (s) => diffOut.push(s), stderr: (s) => diffOut.push(s), env: {} });
    expect(diffOut.join("\n")).toContain("Cross-engine diff");
  });

  it("report runs end-to-end with an injected provider and records history", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "jbm-"));
    const log = collector();
    await runCli(["init"], { cwd, stdout: () => {}, stderr: () => {} });
    // overwrite placeholder config with a real one
    const cfg = { brand: "Acme", competitors: ["Beta"], prompts: ["best crm?"], samples: 1 };
    const fs = await import("node:fs");
    fs.writeFileSync(join(cwd, "brand.config.json"), JSON.stringify(cfg));

    const code = await runCli(["report"], {
      cwd,
      stdout: log.out,
      stderr: log.out,
      makeProvider: fakeProvider,
      now: () => "2026-06-27T00:00:00Z",
    });
    expect(code).toBe(0);
    expect(existsSync(join(cwd, "brand-report.md"))).toBe(true);
    expect(readFileSync(join(cwd, "brand-report.md"), "utf8")).toContain("Brand Visibility on Claude — Acme");
    expect(log.text()).toMatch(/Overall:/);

    // second run should now show history deltas via watch
    const log2 = collector();
    const watchCode = await runCli(["watch"], { cwd, stdout: log2.out, stderr: log2.out });
    expect(watchCode).toBe(0);
    expect(log2.text()).toContain("Acme");
  });
});
