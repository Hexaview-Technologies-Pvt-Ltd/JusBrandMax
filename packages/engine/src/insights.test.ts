import { describe, it, expect } from "vitest";
import type { AskResult } from "./provider.js";
import { computeReport } from "./report.js";
import { buildRecommendations, summarize } from "./insights.js";

const run = (prompt: string, responses: string[]): AskResult => ({ prompt, model: "m", responses });

const report = computeReport({
  brand: "Acme",
  model: "m",
  generatedAt: "t",
  brandNames: ["Acme"],
  competitors: ["Beta"],
  runs: [run("best crm?", ["Acme and Beta"]), run("how do I track leads?", ["Beta only"])],
  sentimentLabels: ["positive", "absent"],
  accuracyClaims: [{ claim: "c", verdict: "contradicted" }],
  indirectPrompts: ["how do I track leads?"],
});

describe("buildRecommendations", () => {
  it("produces impact-first, data-backed actions", () => {
    const recs = buildRecommendations(report);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]?.impact).toBe("high");
    expect(recs.some((r) => /indirect/i.test(r.title))).toBe(true);
    expect(recs.some((r) => /false claim/i.test(r.title))).toBe(true);
  });
});

describe("summarize", () => {
  it("writes a data-derived paragraph", () => {
    const s = summarize(report);
    expect(s).toContain("Acme");
    expect(s).toMatch(/\/100/);
    expect(s).toMatch(/problem-led/i);
  });
});

describe("computeReport wiring", () => {
  it("attaches summary, recommendations, evidence, confidence", () => {
    expect(report.summary.length).toBeGreaterThan(10);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.evidence.length).toBeGreaterThan(0);
    expect(report.confidence.level).toBe("low"); // 1 sample/prompt
  });
});
