/**
 * Pure, deterministic scorers for the Brand Visibility on Claude report.
 *
 * Every scorer takes the raw per-prompt sampled answers (`AskResult[]`) plus the
 * brand's names and competitor names, and returns numbers computed in plain code
 * — no LLM, no hidden weighting. This is the "open & auditable scoring" promise.
 */
import type { AskResult } from "./provider.js";
import { detectMention } from "./mentions.js";

function inc(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

// ── Presence / AI Visibility Score (feature #2) ──────────────────────────────
export interface VisibilityScore {
  promptCount: number;
  sampleCount: number;
  mentioningSamples: number;
  /** Share of all sampled answers that mention the brand. */
  visibility: number;
  perPrompt: Array<{ prompt: string; rate: number }>;
}

export function scoreVisibility(runs: AskResult[], brandNames: string[]): VisibilityScore {
  let sampleCount = 0;
  let mentioningSamples = 0;
  const perPrompt = runs.map((r) => {
    const n = r.responses.length;
    const hits = r.responses.filter((t) => detectMention(t, brandNames).matched).length;
    sampleCount += n;
    mentioningSamples += hits;
    // Per-prompt rate = mentioning samples / total samples for that prompt.
    return { prompt: r.prompt, rate: n ? hits / n : 0 };
  });
  return {
    promptCount: runs.length,
    sampleCount,
    mentioningSamples,
    // Visibility = mentioning samples / all samples.
    visibility: sampleCount ? mentioningSamples / sampleCount : 0,
    perPrompt,
  };
}

// ── Share of Voice (feature #3) ──────────────────────────────────────────────
export interface ShareOfVoice {
  brand: string;
  /** Brand mentioning-samples / all brands' mentioning-samples. */
  brandShare: number;
  /** name → number of samples mentioning it (binary per sample). */
  mentioningSamples: Record<string, number>;
}

export function scoreShareOfVoice(
  runs: AskResult[],
  brandNames: string[],
  competitors: string[],
  brandLabel: string,
): ShareOfVoice {
  const totals: Record<string, number> = { [brandLabel]: 0 };
  for (const c of competitors) totals[c] = 0;

  for (const r of runs) {
    for (const text of r.responses) {
      if (detectMention(text, brandNames).matched) inc(totals, brandLabel);
      for (const c of competitors) {
        if (detectMention(text, [c]).matched) inc(totals, c);
      }
    }
  }

  const denom = sum(Object.values(totals));
  return {
    brand: brandLabel,
    // Share of Voice = brand mentions / total brand+competitor mentions.
    brandShare: denom ? (totals[brandLabel] ?? 0) / denom : 0,
    mentioningSamples: totals,
  };
}

// ── Prominence (feature #4) ──────────────────────────────────────────────────
export interface ProminenceScore {
  brand: string;
  samplesWithBrand: number;
  firstMentions: number;
  /** First-mention wins / samples where the brand appears. */
  firstMentionRate: number;
}

export function scoreProminence(
  runs: AskResult[],
  brandNames: string[],
  competitors: string[],
  brandLabel: string,
): ProminenceScore {
  let samplesWithBrand = 0;
  let firstMentions = 0;

  for (const r of runs) {
    for (const text of r.responses) {
      const b = detectMention(text, brandNames);
      if (!b.matched) continue;
      samplesWithBrand += 1;

      let earliestCompetitor = Number.POSITIVE_INFINITY;
      for (const c of competitors) {
        const h = detectMention(text, [c]);
        if (h.matched && h.firstIndex < earliestCompetitor) earliestCompetitor = h.firstIndex;
      }
      // First-mention win = brand appears before every competitor (or alone).
      if (b.firstIndex <= earliestCompetitor) firstMentions += 1;
    }
  }

  return {
    brand: brandLabel,
    samplesWithBrand,
    firstMentions,
    firstMentionRate: samplesWithBrand ? firstMentions / samplesWithBrand : 0,
  };
}

// ── Competitor leaderboard (feature #15) ─────────────────────────────────────
export interface LeaderboardEntry {
  name: string;
  mentioningSamples: number;
  share: number;
  isBrand: boolean;
}

export function buildLeaderboard(
  runs: AskResult[],
  brandNames: string[],
  competitors: string[],
  brandLabel: string,
): LeaderboardEntry[] {
  const sov = scoreShareOfVoice(runs, brandNames, competitors, brandLabel);
  const denom = sum(Object.values(sov.mentioningSamples));
  const entries = Object.entries(sov.mentioningSamples).map(([name, mentions]) => ({
    name,
    mentioningSamples: mentions,
    share: denom ? mentions / denom : 0,
    isBrand: name === brandLabel,
  }));
  // Rank by mentions desc, then name asc for stable ordering.
  entries.sort((a, b) => b.mentioningSamples - a.mentioningSamples || a.name.localeCompare(b.name));
  return entries;
}

// ── Competitor gap analysis (feature #16) ────────────────────────────────────
export interface GapItem {
  prompt: string;
  brandRate: number;
  competitorsPresent: string[];
}

export function findGaps(
  runs: AskResult[],
  brandNames: string[],
  competitors: string[],
): GapItem[] {
  const gaps: GapItem[] = [];
  for (const r of runs) {
    const brandHits = r.responses.filter((t) => detectMention(t, brandNames).matched).length;
    // A gap = brand is absent from every sample but ≥1 competitor appears.
    if (brandHits > 0) continue;
    const present = competitors.filter((c) =>
      r.responses.some((t) => detectMention(t, [c]).matched),
    );
    if (present.length > 0) {
      gaps.push({ prompt: r.prompt, brandRate: 0, competitorsPresent: present });
    }
  }
  gaps.sort((a, b) => b.competitorsPresent.length - a.competitorsPresent.length);
  return gaps;
}
