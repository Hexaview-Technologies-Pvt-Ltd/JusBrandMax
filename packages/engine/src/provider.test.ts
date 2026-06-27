import { describe, it, expect } from "vitest";
import { createClaudeProvider, extractText } from "./provider.js";

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
  it("draws N samples over fetch and returns one response per sample", async () => {
    let calls = 0;
    const fetchImpl = (async (url, init) => {
      calls += 1;
      const body = JSON.parse(String((init as RequestInit).body)) as {
        messages: Array<{ content: string }>;
      };
      const q = body.messages[0]?.content ?? "";
      return new Response(JSON.stringify({ content: [{ type: "text", text: `answer ${calls} to "${q}"` }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const provider = createClaudeProvider({ apiKey: "test", fetchImpl });
    const res = await provider.ask("what is the best CRM?", { model: "claude-opus-4-8", samples: 3 });

    expect(calls).toBe(3);
    expect(res.responses).toHaveLength(3);
    expect(res.model).toBe("claude-opus-4-8");
    expect(res.responses[0]).toContain("best CRM");
  });

  it("throws a helpful error on non-2xx", async () => {
    const fetchImpl = (async () =>
      new Response("nope", { status: 401 })) as typeof fetch;
    const provider = createClaudeProvider({ apiKey: "bad", fetchImpl });
    await expect(provider.ask("q", { model: "m" })).rejects.toThrow(/401/);
  });
});
