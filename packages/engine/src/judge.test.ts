import { describe, it, expect } from "vitest";
import type { ClaudeProvider } from "./provider.js";
import {
  extractJson,
  judgeSentiment,
  judgeAccuracy,
  aggregateSentiment,
  aggregateAccuracy,
  normalizeSentiment,
  normalizeVerdict,
} from "./judge.js";

/** Fake provider that returns a fixed canned answer regardless of input. */
function cannedProvider(answer: string): ClaudeProvider {
  return {
    ask: async (prompt, opts) => ({ prompt, model: opts.model, responses: [answer] }),
  };
}

describe("extractJson", () => {
  it("parses bare JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });
  it("parses JSON inside a code fence", () => {
    expect(extractJson('```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });
  it("parses JSON embedded in prose", () => {
    expect(extractJson('Sure! {"a":3} hope that helps')).toEqual({ a: 3 });
  });
  it("throws when no JSON present", () => {
    expect(() => extractJson("no json here")).toThrow(/no JSON/);
  });
});

describe("sentiment", () => {
  it("normalizes loose labels", () => {
    expect(normalizeSentiment("Positive")).toBe("positive");
    expect(normalizeSentiment("NEG")).toBe("negative");
    expect(normalizeSentiment("absent")).toBe("absent");
    expect(normalizeSentiment("whatever")).toBe("neutral");
  });

  it("judges sentiment via the provider", async () => {
    const provider = cannedProvider('{"label":"positive","rationale":"praises it"}');
    const r = await judgeSentiment(provider, { model: "m", brand: "Acme", answer: "Acme is great" });
    expect(r).toEqual({ label: "positive", rationale: "praises it" });
  });

  it("aggregates net sentiment excluding absent", () => {
    const s = aggregateSentiment(["positive", "positive", "negative", "absent"]);
    expect(s.counts).toEqual({ positive: 2, neutral: 0, negative: 1, absent: 1 });
    // (2 - 1) / 3 considered
    expect(s.net).toBeCloseTo(1 / 3);
  });
});

describe("accuracy", () => {
  it("normalizes verdicts", () => {
    expect(normalizeVerdict("Supported")).toBe("supported");
    expect(normalizeVerdict("contradicts")).toBe("contradicted");
    expect(normalizeVerdict("dunno")).toBe("unsupported");
  });

  it("judges claims via the provider and drops empty claims", async () => {
    const provider = cannedProvider(
      '{"claims":[{"claim":"Founded 2010","verdict":"supported"},{"claim":"","verdict":"x"},{"claim":"Free tier","verdict":"contradicted"}]}',
    );
    const r = await judgeAccuracy(provider, { model: "m", brand: "Acme", answer: "..." });
    expect(r.claims).toEqual([
      { claim: "Founded 2010", verdict: "supported" },
      { claim: "Free tier", verdict: "contradicted" },
    ]);
  });

  it("aggregates accuracy as supported / total", () => {
    const a = aggregateAccuracy([
      { claim: "a", verdict: "supported" },
      { claim: "b", verdict: "supported" },
      { claim: "c", verdict: "contradicted" },
      { claim: "d", verdict: "unsupported" },
    ]);
    expect(a).toEqual({ total: 4, supported: 2, unsupported: 1, contradicted: 1, accuracy: 0.5 });
  });

  it("returns accuracy 1.0 when there are no claims", () => {
    expect(aggregateAccuracy([]).accuracy).toBe(1);
  });
});
