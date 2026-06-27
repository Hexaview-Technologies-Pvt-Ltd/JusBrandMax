import { describe, it, expect } from "vitest";
import type { AskResult } from "./provider.js";
import { computeReport } from "./report.js";
import { diffReports, renderDiffMarkdown } from "./diff.js";

const run = (prompt: string, responses: string[]): AskResult => ({ prompt, model: "m", responses });
const mk = (engine: string, brandResp: string) =>
  computeReport({
    brand: "Acme",
    engine,
    model: "m",
    generatedAt: engine,
    brandNames: ["Acme"],
    competitors: ["Beta"],
    runs: [run("best crm?", [brandResp])],
    sentimentLabels: ["positive"],
    accuracyClaims: [],
  });

describe("diffReports", () => {
  it("computes per-dimension deltas between two engines", () => {
    const a = mk("Claude", "Acme is best"); // brand present → visibility 1
    const b = mk("OpenAI", "Beta is best"); // brand absent → visibility 0
    const d = diffReports(a, b);
    expect(d.a.label).toContain("Claude");
    expect(d.b.label).toContain("OpenAI");
    const presence = d.dimensions.find((x) => x.name === "Presence");
    expect(presence?.delta).toBe(-1);
    expect(renderDiffMarkdown(a, b)).toContain("Cross-engine diff");
  });
});
