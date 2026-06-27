import { describe, it, expect } from "vitest";
import { CATEGORY_PACKS, listPacks, getPack } from "./packs.js";

describe("category packs", () => {
  it("exposes the headline verticals", () => {
    const ids = listPacks().map((p) => p.id);
    for (const id of ["ecommerce", "travel", "hospitality", "software", "hardware"]) {
      expect(ids).toContain(id);
    }
  });

  it("getPack is case-insensitive and returns prompts", () => {
    const pack = getPack("ECOMMERCE");
    expect(pack?.label).toMatch(/E-commerce/i);
    expect(pack?.prompts.length).toBeGreaterThan(5);
  });

  it("returns undefined for unknown ids", () => {
    expect(getPack("nope")).toBeUndefined();
  });

  it("packs are trademark-free (no third-party brand names baked in)", () => {
    // Guard against accidentally hardcoding a competitor/vendor trademark in a pack.
    const banned = /\b(salesforce|hubspot|booking\.com|airbnb|expedia|shopify|amazon|google|profound|peec|athena|otterly|scrunch)\b/i;
    for (const pack of CATEGORY_PACKS) {
      for (const prompt of pack.prompts) {
        expect(banned.test(prompt), `${pack.id}: "${prompt}"`).toBe(false);
      }
    }
  });
});
