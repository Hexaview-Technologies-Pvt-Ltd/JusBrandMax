import { describe, it, expect } from "vitest";
import { VERSION } from "./index.js";

describe("engine", () => {
  it("exposes a semver version", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
