import { describe, it, expect } from "vitest";
import { createClaudeProvider, extractText, type MessagesClient } from "./provider.js";

describe("extractText", () => {
  it("concatenates text blocks and ignores non-text blocks", () => {
    const text = extractText({
      content: [
        { type: "text", text: "Hello " },
        { type: "thinking" },
        { type: "text", text: "world" },
      ],
    });
    expect(text).toBe("Hello world");
  });
});

describe("createClaudeProvider", () => {
  it("draws N samples and returns one response per sample", async () => {
    let calls = 0;
    const fake: MessagesClient = {
      messages: {
        create: async (params) => {
          calls += 1;
          const q = params.messages[0]?.content ?? "";
          return { content: [{ type: "text", text: `answer ${calls} to "${q}"` }] };
        },
      },
    };

    const provider = createClaudeProvider({ client: fake });
    const res = await provider.ask("what is the best CRM?", {
      model: "claude-opus-4-8",
      samples: 3,
    });

    expect(calls).toBe(3);
    expect(res.responses).toHaveLength(3);
    expect(res.model).toBe("claude-opus-4-8");
    expect(res.prompt).toBe("what is the best CRM?");
    expect(res.responses[0]).toContain("best CRM");
  });

  it("defaults to a single sample", async () => {
    const fake: MessagesClient = {
      messages: { create: async () => ({ content: [{ type: "text", text: "ok" }] }) },
    };
    const res = await createClaudeProvider({ client: fake }).ask("q", { model: "m" });
    expect(res.responses).toEqual(["ok"]);
  });
});
