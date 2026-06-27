import { describe, it, expect } from "vitest";
import type { AskResult } from "./provider.js";
import {
  scoreVisibility,
  scoreShareOfVoice,
  scoreProminence,
  buildLeaderboard,
  findGaps,
} from "./scorers.js";

const run = (prompt: string, responses: string[]): AskResult => ({ prompt, model: "m", responses });

const runs: AskResult[] = [
  run("best crm?", ["I recommend Acme and Beta.", "Beta is great, also Acme."]),
  run("cheap crm?", ["Try Beta or Gamma.", "Gamma and Beta are cheap."]),
];
const brandNames = ["Acme"];
const competitors = ["Beta", "Gamma"];

describe("scoreVisibility", () => {
  it("computes overall and per-prompt visibility", () => {
    const v = scoreVisibility(runs, brandNames);
    expect(v.sampleCount).toBe(4);
    expect(v.mentioningSamples).toBe(2);
    expect(v.visibility).toBe(0.5);
    expect(v.perPrompt[0]).toEqual({ prompt: "best crm?", rate: 1 });
    expect(v.perPrompt[1]).toEqual({ prompt: "cheap crm?", rate: 0 });
  });
});

describe("scoreShareOfVoice", () => {
  it("computes share against competitors", () => {
    const sov = scoreShareOfVoice(runs, brandNames, competitors, "Acme");
    expect(sov.mentioningSamples).toEqual({ Acme: 2, Beta: 4, Gamma: 2 });
    expect(sov.brandShare).toBe(0.25);
  });
});

describe("scoreProminence", () => {
  it("counts first-mention wins among samples with the brand", () => {
    const p = scoreProminence(runs, brandNames, competitors, "Acme");
    expect(p.samplesWithBrand).toBe(2);
    expect(p.firstMentions).toBe(1); // "Acme and Beta" wins; "Beta ... Acme" loses
    expect(p.firstMentionRate).toBe(0.5);
  });
});

describe("buildLeaderboard", () => {
  it("ranks brands by mentioning samples", () => {
    const board = buildLeaderboard(runs, brandNames, competitors, "Acme");
    expect(board.map((e) => e.name)).toEqual(["Beta", "Acme", "Gamma"]);
    expect(board[0]).toMatchObject({ name: "Beta", mentioningSamples: 4, share: 0.5 });
    expect(board.find((e) => e.isBrand)?.name).toBe("Acme");
  });
});

describe("findGaps", () => {
  it("flags prompts where competitors appear but the brand is absent", () => {
    const gaps = findGaps(runs, brandNames, competitors);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toEqual({
      prompt: "cheap crm?",
      brandRate: 0,
      competitorsPresent: ["Beta", "Gamma"],
    });
  });
});
