import { describe, it, expect } from "vitest";
import type { AskResult, ClaudeProvider } from "./provider.js";
import { resolveBrandConfig } from "./config.js";
import { computeReport, runReport, renderMarkdown, renderHtml } from "./report.js";

const run = (prompt: string, responses: string[]): AskResult => ({ prompt, model: "m", responses });

describe("computeReport", () => {
  it("blends six dimensions into a 0–100 overall", () => {
    const report = computeReport({
      brand: "Acme",
      model: "claude-opus-4-8",
      generatedAt: "2026-06-27T00:00:00Z",
      brandNames: ["Acme"],
      competitors: ["Beta"],
      runs: [run("best crm?", ["Acme is best, ahead of Beta.", "Acme leads Beta."])],
      sentimentLabels: ["positive", "positive"],
      accuracyClaims: [{ claim: "x", verdict: "supported" }],
    });
    expect(report.dimensions.presence.visibility).toBe(1);
    expect(report.dimensions.shareOfVoice.brandShare).toBe(0.5);
    expect(report.dimensions.prominence.firstMentionRate).toBe(1);
    expect(report.overall).toBe(90);
  });
});

describe("runReport", () => {
  it("orchestrates measurement + judging against the provider", async () => {
    const provider: ClaudeProvider = {
      ask: async (prompt, opts) => {
        const mk = (t: string): AskResult => ({
          prompt,
          model: opts.model,
          responses: Array.from({ length: opts.samples ?? 1 }, () => t),
        });
        if (opts.system?.includes("portrays")) return mk('{"label":"positive","rationale":"good"}');
        if (opts.system?.includes("fact-check"))
          return mk('{"claims":[{"claim":"Founded 2010","verdict":"supported"}]}');
        return mk("Acme is the best CRM, ahead of Beta.");
      },
    };
    const config = resolveBrandConfig({
      brand: "Acme",
      prompts: ["best crm?"],
      competitors: ["Beta"],
      samples: 2,
    });

    const report = await runReport(provider, config, { now: "2026-06-27T00:00:00Z" });
    expect(report.brand).toBe("Acme");
    expect(report.engine).toBe("Claude");
    expect(report.dimensions.presence.visibility).toBe(1);
    expect(report.dimensions.sentiment.counts.positive).toBe(2);
    expect(report.dimensions.accuracy.total).toBe(2);
    expect(report.overall).toBe(90);
  });

  it("labels the engine from the config provider", async () => {
    const provider: ClaudeProvider = {
      ask: async (prompt, opts) => {
        if (opts.system?.includes("portrays"))
          return { prompt, model: opts.model, responses: ['{"label":"positive","rationale":"x"}'] };
        if (opts.system?.includes("fact-check"))
          return { prompt, model: opts.model, responses: ['{"claims":[]}'] };
        return { prompt, model: opts.model, responses: ["Acme is great."] };
      },
    };
    const config = resolveBrandConfig({ brand: "Acme", prompts: ["q?"], provider: "openai", model: "gpt-x" });
    const report = await runReport(provider, config, { now: "2026-06-27T00:00:00Z" });
    expect(report.engine).toBe("OpenAI");
    expect(renderMarkdown(report)).toContain("Brand Visibility on OpenAI — Acme");
  });
});

describe("renderers", () => {
  const report = computeReport({
    brand: "Acme",
    model: "claude-opus-4-8",
    generatedAt: "2026-06-27T00:00:00Z",
    brandNames: ["Acme"],
    competitors: ["Beta"],
    runs: [run("best crm?", ["Acme beats Beta."])],
    sentimentLabels: ["positive"],
    accuracyClaims: [{ claim: "x", verdict: "supported" }],
  });

  it("renders markdown without branding by default", () => {
    const md = renderMarkdown(report);
    expect(md).toContain("Brand Visibility on Claude — Acme");
    expect(md).toContain(`Overall: ${report.overall}/100`);
    expect(md).not.toContain("jusBrandMax");
  });

  it("adds a footer only when opted in", () => {
    expect(renderMarkdown(report, { footer: true })).toContain("jusBrandMax");
  });

  it("renders html with a dimensions table", () => {
    expect(renderHtml(report)).toContain("<table");
  });
});

describe("intent breakdown & modes", () => {
  const base = computeReport({
    brand: "Acme",
    model: "m",
    generatedAt: "t",
    brandNames: ["Acme"],
    competitors: ["Beta"],
    runs: [
      run("best crm?", ["Acme and Beta"]), // direct — brand present
      run("how do I track leads?", ["Beta is good"]), // indirect — brand absent
    ],
    sentimentLabels: ["positive", "absent"],
    accuracyClaims: [],
    indirectPrompts: ["how do I track leads?"],
  });

  it("splits visibility by direct vs indirect intent", () => {
    expect(base.intentBreakdown.direct).toEqual({ promptCount: 1, visibility: 1 });
    expect(base.intentBreakdown.indirect).toEqual({ promptCount: 1, visibility: 0 });
  });

  it("quick mode is headline-only; standard adds leaderboard + intent; detailed adds per-prompt", () => {
    const quick = renderMarkdown(base, { mode: "quick" });
    expect(quick).not.toContain("Competitor leaderboard");
    expect(quick).not.toContain("Intent breakdown");

    const std = renderMarkdown(base, { mode: "standard" });
    expect(std).toContain("Competitor leaderboard");
    expect(std).toContain("Intent breakdown");

    const det = renderMarkdown(base, { mode: "detailed" });
    expect(det).toContain("Per-prompt visibility");
  });
});
