import { describe, it, expect } from "vitest";
import { createOpenAICompatibleProvider, extractOpenAIText } from "./provider-openai.js";

describe("extractOpenAIText", () => {
  it("reads the first choice's content", () => {
    expect(extractOpenAIText({ choices: [{ message: { content: "hello" } }] })).toBe("hello");
  });
  it("returns empty string when missing", () => {
    expect(extractOpenAIText({})).toBe("");
  });
});

describe("createOpenAICompatibleProvider", () => {
  it("posts to /chat/completions, samples N, and includes a system message", async () => {
    const seen: Array<{ url: string; body: Record<string, unknown>; auth: string | null }> = [];
    const fetchImpl = (async (url, init) => {
      const i = init as RequestInit;
      seen.push({
        url: String(url),
        body: JSON.parse(String(i.body)),
        auth: new Headers(i.headers).get("authorization"),
      });
      return new Response(JSON.stringify({ choices: [{ message: { content: `r${seen.length}` } }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const provider = createOpenAICompatibleProvider({
      apiKey: "sk-test",
      baseURL: "https://api.example.com/v1/",
      fetchImpl,
    });
    const res = await provider.ask("best crm?", { model: "gpt-x", samples: 2, system: "judge" });

    expect(res.responses).toEqual(["r1", "r2"]);
    expect(seen[0]?.url).toBe("https://api.example.com/v1/chat/completions"); // trailing slash trimmed
    expect(seen[0]?.auth).toBe("Bearer sk-test");
    expect(seen[0]?.body["model"]).toBe("gpt-x");
    expect((seen[0]?.body["messages"] as Array<{ role: string }>)[0]?.role).toBe("system");
  });

  it("throws on non-2xx", async () => {
    const fetchImpl = (async () => new Response("bad", { status: 500 })) as typeof fetch;
    const provider = createOpenAICompatibleProvider({ apiKey: "x", fetchImpl });
    await expect(provider.ask("q", { model: "m" })).rejects.toThrow(/500/);
  });
});
