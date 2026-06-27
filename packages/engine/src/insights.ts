/**
 * Insights — data-backed narrative + an ordered Action Center, derived purely
 * from a computed report. No LLM, no hand-waving: every sentence and every
 * recommendation is a deterministic function of the numbers, so the descriptive
 * reports in `examples/` are exactly what the plugin emits.
 */
import type { BrandReport } from "./report.js";

export interface Recommendation {
  title: string;
  rationale: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
}

const RANK = { high: 3, medium: 2, low: 1 } as const;
const pct = (x: number): string => `${Math.round(x * 100)}%`;

/** Ordered, impact-first action list computed from the report's own numbers. */
export function buildRecommendations(r: BrandReport): Recommendation[] {
  const d = r.dimensions;
  const recs: Recommendation[] = [];

  if (r.intentBreakdown.indirect.promptCount > 0 && r.intentBreakdown.indirect.visibility === 0) {
    recs.push({
      title: "Win indirect-intent questions",
      rationale: `You appear in ${pct(r.intentBreakdown.direct.visibility)} of direct "best <category>" answers but ${pct(r.intentBreakdown.indirect.visibility)} of the problem-led questions buyers ask earlier. Publish problem-led content for those topics.`,
      impact: "high",
      effort: "medium",
    });
  }
  if (d.accuracy.contradicted > 0) {
    recs.push({
      title: `Correct ${d.accuracy.contradicted} false claim(s) the model makes about you`,
      rationale: "The model states things about your brand that contradict your facts. Publish authoritative, structured corrections.",
      impact: "high",
      effort: "low",
    });
  }
  for (const g of r.gaps.slice(0, 3)) {
    recs.push({
      title: `Close the gap on "${g.prompt}"`,
      rationale: `Competitors (${g.competitorsPresent.join(", ")}) appear here and you don't. Create content that directly answers this question.`,
      impact: "high",
      effort: "medium",
    });
  }
  if (d.accuracy.unsupported > 0) {
    recs.push({
      title: `Ground ${d.accuracy.unsupported} unverifiable claim(s)`,
      rationale: "The model asserts facts it can't support. Add a Brand Knowledge Pack so the record is verifiable.",
      impact: "medium",
      effort: "low",
    });
  }
  if (d.presence.visibility > 0 && d.prominence.firstMentionRate < 0.5) {
    recs.push({
      title: "Improve prominence — you're mentioned but rarely first",
      rationale: `Your first-mention rate is ${pct(d.prominence.firstMentionRate)}. Strengthen category authority so the model leads with you.`,
      impact: "medium",
      effort: "medium",
    });
  }
  const leader = r.leaderboard.find((e) => !e.isBrand);
  const me = r.leaderboard.find((e) => e.isBrand);
  if (leader && me && leader.share > me.share) {
    recs.push({
      title: `Close the share-of-voice gap vs ${leader.name}`,
      rationale: `${leader.name} holds ${pct(leader.share)} of mentions to your ${pct(me.share)}.`,
      impact: "medium",
      effort: "high",
    });
  }

  recs.sort((a, b) => RANK[b.impact] - RANK[a.impact] || RANK[a.effort] - RANK[b.effort]);
  return recs;
}

/** One-paragraph executive summary, fully derived from the report. */
export function summarize(r: BrandReport): string {
  const d = r.dimensions;
  const dims: Array<[string, number]> = [
    ["presence", d.presence.visibility],
    ["share of voice", d.shareOfVoice.brandShare],
    ["prominence", d.prominence.firstMentionRate],
    ["accuracy", d.accuracy.accuracy],
  ];
  const sorted = [...dims].sort((a, b) => b[1] - a[1]);
  const strong = sorted[0]!;
  const weak = sorted[sorted.length - 1]!;
  const top = buildRecommendations(r)[0];

  const parts = [
    `${r.brand} scores ${r.overall}/100 for brand visibility on ${r.engine} (model ${r.model}), measured across ${r.promptCount} prompts and ${r.sampleCount} samples.`,
    `It is mentioned in ${pct(d.presence.visibility)} of answers, with a ${pct(d.shareOfVoice.brandShare)} share of voice against its competitors.`,
  ];
  if (r.intentBreakdown.indirect.promptCount > 0) {
    parts.push(
      `Visibility is ${pct(r.intentBreakdown.direct.visibility)} on direct "best <category>" questions but ${pct(r.intentBreakdown.indirect.visibility)} on the problem-led questions buyers ask earlier in the journey.`,
    );
  }
  parts.push(`It is strongest on ${strong[0]} (${pct(strong[1])}) and weakest on ${weak[0]} (${pct(weak[1])}).`);
  if (d.accuracy.contradicted > 0 || d.accuracy.unsupported > 0) {
    parts.push(`The model makes ${d.accuracy.contradicted} contradicted and ${d.accuracy.unsupported} unsupported claim(s) about the brand.`);
  }
  if (top) parts.push(`Top priority: ${top.title}.`);
  return parts.join(" ");
}

/** Per-dimension plain-language interpretation (for detailed reports). */
export function interpretDimensions(r: BrandReport): string[] {
  const d = r.dimensions;
  const band = (x: number, low: string, mid: string, high: string) => (x < 0.34 ? low : x < 0.67 ? mid : high);
  return [
    `**Presence** — mentioned in ${pct(d.presence.visibility)} of answers. ${band(d.presence.visibility, "Largely invisible for this prompt set.", "Present, but with clear room to grow.", "Strong category presence.")}`,
    `**Share of Voice** — ${pct(d.shareOfVoice.brandShare)} of all brand mentions. ${band(d.shareOfVoice.brandShare, "Competitors dominate the conversation.", "Competitive, not leading.", "You own the conversation.")}`,
    `**Prominence** — first-mention rate ${pct(d.prominence.firstMentionRate)}. ${band(d.prominence.firstMentionRate, "Usually an afterthought when mentioned.", "Sometimes leads, often follows.", "Typically named first.")}`,
    `**Sentiment** — net ${d.sentiment.net.toFixed(2)}. ${d.sentiment.net > 0.2 ? "The model frames you positively." : d.sentiment.net < -0.2 ? "The model frames you negatively — investigate." : "Neutral framing."}`,
    `**Accuracy** — ${pct(d.accuracy.accuracy)} of claims supported (${d.accuracy.contradicted} contradicted, ${d.accuracy.unsupported} unsupported). ${d.accuracy.contradicted > 0 ? "Active misinformation to correct." : "No contradicted claims detected."}`,
  ];
}
