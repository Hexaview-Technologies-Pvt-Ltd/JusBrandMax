import { describe, it, expect } from "vitest";
import type { AskResult } from "./provider.js";
import { computeReport } from "./report.js";
import { renderBadge } from "./badge.js";

const run = (prompt: string, responses: string[]): AskResult => ({ prompt, model: "m", responses });
const report = computeReport({
  brand: "Acme",
  engine: "Claude",
  model: "m",
  generatedAt: "t",
  brandNames: ["Acme"],
  competitors: ["Beta"],
  runs: [run("best crm?", ["Acme is best"])],
  sentimentLabels: ["positive"],
  accuracyClaims: [],
});

describe("renderBadge", () => {
  it("emits an SVG with the engine label and score", () => {
    const svg = renderBadge(report);
    expect(svg).toContain("<svg");
    expect(svg).toContain("brand visibility on Claude");
    expect(svg).toContain(`${report.overall}/100`);
  });
});
