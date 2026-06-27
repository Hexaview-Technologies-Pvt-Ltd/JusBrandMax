import { describe, it, expect } from "vitest";
import { detectMention } from "./mentions.js";

describe("detectMention", () => {
  it("matches case-insensitively", () => {
    expect(detectMention("acme is great", ["Acme"]).matched).toBe(true);
  });

  it("respects word boundaries", () => {
    expect(detectMention("Acmecorp rules", ["Acme"]).matched).toBe(false);
  });

  it("counts multiple occurrences and reports first index", () => {
    const hit = detectMention("Acme beats Beta, but Acme wins", ["Acme"]);
    expect(hit.count).toBe(2);
    expect(hit.firstIndex).toBe(0);
  });

  it("matches any alias", () => {
    expect(detectMention("I use AcmeCRM daily", ["Acme", "AcmeCRM"]).matched).toBe(true);
  });

  it("handles names with punctuation", () => {
    expect(detectMention("I love AT&T coverage", ["AT&T"]).matched).toBe(true);
  });

  it("returns no match for empty name list", () => {
    expect(detectMention("anything", []).matched).toBe(false);
  });
});
