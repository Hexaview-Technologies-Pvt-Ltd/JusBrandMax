import { describe, it, expect } from "vitest";
import type { AskResult } from "./provider.js";
import { extractEvidence } from "./evidence.js";

const run = (prompt: string, responses: string[]): AskResult => ({ prompt, model: "m", responses });

describe("extractEvidence", () => {
  it("quotes the brand sentence, or what won when the brand is absent", () => {
    const ev = extractEvidence(
      [run("best crm?", ["Acme is a great pick. Beta is fine too."]), run("track leads?", ["Beta wins here."])],
      ["Acme"],
      ["Beta"],
    );
    expect(ev[0]).toEqual({ prompt: "best crm?", quote: "Acme is a great pick.", brand: true });
    expect(ev[1]).toEqual({ prompt: "track leads?", quote: "Beta wins here.", brand: false });
  });
});
