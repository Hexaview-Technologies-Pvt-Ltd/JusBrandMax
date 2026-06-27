import { describe, it, expect } from "vitest";
import {
  resolveBrandConfig,
  parseBrandConfig,
  DEFAULT_MODEL,
  DEFAULT_SAMPLES,
} from "./config.js";

describe("resolveBrandConfig", () => {
  it("applies defaults and trims input", () => {
    const c = resolveBrandConfig({ brand: " Acme ", prompts: [" best crm? ", ""] });
    expect(c.brand).toBe("Acme");
    expect(c.prompts).toEqual(["best crm?"]);
    expect(c.model).toBe(DEFAULT_MODEL);
    expect(c.samples).toBe(DEFAULT_SAMPLES);
    expect(c.aliases).toEqual([]);
    expect(c.competitors).toEqual([]);
  });

  it("throws when brand is missing", () => {
    expect(() => resolveBrandConfig({ prompts: ["x"] })).toThrow(/brand/);
  });

  it("throws when prompts is empty", () => {
    expect(() => resolveBrandConfig({ brand: "Acme", prompts: [] })).toThrow(/prompts/);
  });

  it("rejects non-positive samples", () => {
    expect(() => resolveBrandConfig({ brand: "A", prompts: ["x"], samples: 0 })).toThrow(/samples/);
  });

  it("defaults provider to anthropic and trims baseURL", () => {
    const c = resolveBrandConfig({ brand: "A", prompts: ["x"], baseURL: " http://local:11434/v1 " });
    expect(c.provider).toBe("anthropic");
    expect(c.baseURL).toBe("http://local:11434/v1");
  });

  it("accepts the openai provider", () => {
    expect(resolveBrandConfig({ brand: "A", prompts: ["x"], provider: "openai" }).provider).toBe("openai");
  });

  it("defaults mode to standard and cleans indirect prompts", () => {
    const c = resolveBrandConfig({ brand: "A", prompts: ["x"], indirectPrompts: [" how do I y? ", ""] });
    expect(c.mode).toBe("standard");
    expect(c.indirectPrompts).toEqual(["how do I y?"]);
  });

  it("rejects an unknown mode", () => {
    expect(() =>
      resolveBrandConfig({ brand: "A", prompts: ["x"], mode: "turbo" as never }),
    ).toThrow(/mode/);
  });

  it("rejects an unknown provider", () => {
    expect(() =>
      resolveBrandConfig({ brand: "A", prompts: ["x"], provider: "gemini" as never }),
    ).toThrow(/provider/);
  });
});

describe("parseBrandConfig", () => {
  it("parses a valid JSON object", () => {
    const c = parseBrandConfig(
      JSON.stringify({ brand: "Acme", prompts: ["x"], competitors: ["Beta", " "] }),
    );
    expect(c.competitors).toEqual(["Beta"]);
  });

  it("throws on malformed JSON", () => {
    expect(() => parseBrandConfig("{bad")).toThrow(/invalid JSON/);
  });

  it("rejects a non-object top level", () => {
    expect(() => parseBrandConfig("[1,2]")).toThrow(/object/);
  });
});
