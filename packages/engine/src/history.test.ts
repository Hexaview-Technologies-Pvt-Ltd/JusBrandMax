import { describe, it, expect } from "vitest";
import type { AskResult } from "./provider.js";
import { computeReport, type BrandReport } from "./report.js";
import { openHistory, computeDeltas } from "./history.js";

const run = (prompt: string, responses: string[]): AskResult => ({ prompt, model: "m", responses });

function makeReport(generatedAt: string, brandMentioned: boolean): BrandReport {
  return computeReport({
    brand: "Acme",
    model: "m",
    generatedAt,
    brandNames: ["Acme"],
    competitors: ["Beta"],
    runs: [run("best crm?", [brandMentioned ? "Acme is best" : "Beta is best"])],
    sentimentLabels: [brandMentioned ? "positive" : "absent"],
    accuracyClaims: brandMentioned ? [{ claim: "x", verdict: "supported" }] : [],
  });
}

describe("history store", () => {
  it("saves and reads latest/previous newest-first", () => {
    const store = openHistory(":memory:");
    const older = makeReport("t1", true); // visibility 1
    const newer = makeReport("t2", false); // visibility 0
    store.save(older);
    store.save(newer);

    expect(store.latest("Acme")?.generatedAt).toBe("t2");
    expect(store.previous("Acme")?.generatedAt).toBe("t1");
    expect(store.list("Acme").map((r) => r.generatedAt)).toEqual(["t2", "t1"]);
    expect(store.latest("Unknown")).toBeNull();
    store.close();
  });
});

describe("computeDeltas", () => {
  it("returns null with no previous run", () => {
    expect(computeDeltas(makeReport("t1", true), null)).toBeNull();
  });

  it("computes current minus previous", () => {
    const prev = makeReport("t1", true); // visibility 1
    const cur = makeReport("t2", false); // visibility 0
    const d = computeDeltas(cur, prev)!;
    expect(d.visibility).toBe(-1);
    expect(d.overall).toBeLessThan(0);
  });
});
