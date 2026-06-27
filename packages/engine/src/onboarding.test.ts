import { describe, it, expect } from "vitest";
import type { ClaudeProvider } from "./provider.js";
import { generatePromptUniverse } from "./onboarding.js";

describe("generatePromptUniverse", () => {
  it("parses the model's setup suggestion into clean arrays", async () => {
    const provider: ClaudeProvider = {
      ask: async (prompt, opts) => ({
        prompt,
        model: opts.model,
        responses: [
          '{"prompts":["best crm?","top crm for startups?"],"indirectPrompts":["how do I track leads?"],"competitors":["Globex","Initech",""]}',
        ],
      }),
    };
    const out = await generatePromptUniverse(provider, { brand: "Acme", model: "m", description: "a CRM" });
    expect(out.prompts).toEqual(["best crm?", "top crm for startups?"]);
    expect(out.indirectPrompts).toEqual(["how do I track leads?"]);
    expect(out.competitors).toEqual(["Globex", "Initech"]); // blanks dropped
  });
});
