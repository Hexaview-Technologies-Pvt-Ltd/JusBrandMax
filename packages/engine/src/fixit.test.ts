import { describe, it, expect } from "vitest";
import type { ClaudeProvider } from "./provider.js";
import { draftFix } from "./fixit.js";

describe("draftFix", () => {
  it("returns the model's drafted content", async () => {
    const provider: ClaudeProvider = {
      ask: async (prompt, opts) => ({
        prompt,
        model: opts.model,
        responses: ["# How to track sales leads\n\nAcme CRM helps you..."],
      }),
    };
    const md = await draftFix(provider, { brand: "Acme", model: "m", finding: "Absent on lead-tracking questions." });
    expect(md).toContain("# How to track sales leads");
  });
});
