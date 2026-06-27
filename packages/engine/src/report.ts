/**
 * Report assembly + rendering for "Brand Visibility on Claude".
 *
 * `computeReport` is pure (assembles the six scored dimensions into a report
 * object). `runReport` is the orchestration: it asks Claude every prompt, judges
 * the brand-mentioning answers, and computes the report. Renderers are
 * white-label by default — no jusBrandMax branding unless `footer: true`.
 */
import type { AskResult, ClaudeProvider } from "./provider.js";
import { modeSamples, type BrandConfig, type ReportMode } from "./config.js";
import { detectMention } from "./mentions.js";
import { providerEngineLabel } from "./provider-factory.js";
import { extractEvidence, type EvidenceQuote } from "./evidence.js";
import { buildRecommendations, summarize, interpretDimensions, type Recommendation } from "./insights.js";
import {
  scoreVisibility,
  scoreShareOfVoice,
  scoreProminence,
  buildLeaderboard,
  findGaps,
  type VisibilityScore,
  type ShareOfVoice,
  type ProminenceScore,
  type LeaderboardEntry,
  type GapItem,
} from "./scorers.js";
import {
  judgeSentiment,
  judgeAccuracy,
  aggregateSentiment,
  aggregateAccuracy,
  type SentimentLabel,
  type SentimentSummary,
  type ClaimCheck,
  type AccuracySummary,
} from "./judge.js";

export interface BrandReport {
  brand: string;
  /** Human label of the measured engine, e.g. "Claude" or "OpenAI". */
  engine: string;
  model: string;
  generatedAt: string;
  promptCount: number;
  sampleCount: number;
  dimensions: {
    presence: VisibilityScore;
    shareOfVoice: ShareOfVoice;
    prominence: ProminenceScore;
    sentiment: SentimentSummary;
    accuracy: AccuracySummary;
  };
  leaderboard: LeaderboardEntry[];
  gaps: GapItem[];
  /** Visibility split by intent — direct ("best X") vs indirect (problem/jobs-to-be-done). */
  intentBreakdown: {
    direct: { promptCount: number; visibility: number };
    indirect: { promptCount: number; visibility: number };
  };
  /** Confidence in the numbers, from sample size. */
  confidence: { samplesPerPrompt: number; level: "low" | "medium" | "high" };
  /** Verbatim quotes behind the scores. */
  evidence: EvidenceQuote[];
  /** Ordered, data-backed action list. */
  recommendations: Recommendation[];
  /** One-paragraph executive summary (data-derived). */
  summary: string;
  /** Blended 0–100 headline score. */
  overall: number;
}

export interface ComputeReportInput {
  brand: string;
  /** Engine label; defaults to "Claude". */
  engine?: string;
  model: string;
  generatedAt: string;
  brandNames: string[];
  competitors: string[];
  runs: AskResult[];
  sentimentLabels: SentimentLabel[];
  accuracyClaims: ClaimCheck[];
  /** Prompt texts that are indirect-intent (used to split the intent breakdown). */
  indirectPrompts?: string[];
}

export function computeReport(input: ComputeReportInput): BrandReport {
  const { brand, model, generatedAt, brandNames, competitors, runs } = input;
  const presence = scoreVisibility(runs, brandNames);
  const shareOfVoice = scoreShareOfVoice(runs, brandNames, competitors, brand);
  const prominence = scoreProminence(runs, brandNames, competitors, brand);
  const sentiment = aggregateSentiment(input.sentimentLabels);
  const accuracy = aggregateAccuracy(input.accuracyClaims);
  const leaderboard = buildLeaderboard(runs, brandNames, competitors, brand);
  const gaps = findGaps(runs, brandNames, competitors);

  // Intent breakdown: how visible the brand is on direct vs indirect-intent prompts.
  const indirectSet = new Set(input.indirectPrompts ?? []);
  const directRuns = runs.filter((r) => !indirectSet.has(r.prompt));
  const indirectRuns = runs.filter((r) => indirectSet.has(r.prompt));
  const band = (rs: AskResult[]) => {
    const v = scoreVisibility(rs, brandNames);
    return { promptCount: v.promptCount, visibility: v.visibility };
  };
  const intentBreakdown = { direct: band(directRuns), indirect: band(indirectRuns) };

  const evidence = extractEvidence(runs, brandNames, competitors);
  const samplesPerPrompt = presence.promptCount ? Math.round(presence.sampleCount / presence.promptCount) : 0;
  const confidence = {
    samplesPerPrompt,
    level: (samplesPerPrompt >= 4 ? "high" : samplesPerPrompt >= 2 ? "medium" : "low") as "low" | "medium" | "high",
  };

  // Overall = weighted blend of the six dimensions, scaled to 0–100.
  // Sentiment net (−1..1) is normalized to 0..1 first.
  const sentimentNorm = (sentiment.net + 1) / 2;
  const overall =
    100 *
    (0.3 * presence.visibility +
      0.2 * shareOfVoice.brandShare +
      0.15 * prominence.firstMentionRate +
      0.15 * sentimentNorm +
      0.2 * accuracy.accuracy);

  const report: BrandReport = {
    brand,
    engine: input.engine ?? "Claude",
    model,
    generatedAt,
    promptCount: presence.promptCount,
    sampleCount: presence.sampleCount,
    dimensions: { presence, shareOfVoice, prominence, sentiment, accuracy },
    leaderboard,
    gaps,
    intentBreakdown,
    confidence,
    evidence,
    recommendations: [],
    summary: "",
    overall: Math.round(overall * 10) / 10,
  };
  // Derive narrative + actions from the finished numbers.
  report.recommendations = buildRecommendations(report);
  report.summary = summarize(report);
  return report;
}

export interface RunReportOptions {
  /** ISO timestamp; defaults to now. Injectable for deterministic tests. */
  now?: string;
}

/** Orchestrate a full Brand Visibility on Claude run against the live provider. */
export async function runReport(
  provider: ClaudeProvider,
  config: BrandConfig,
  opts: RunReportOptions = {},
): Promise<BrandReport> {
  const brandNames = [config.brand, ...config.aliases];
  const runs: AskResult[] = [];
  const sentimentLabels: SentimentLabel[] = [];
  const accuracyClaims: ClaimCheck[] = [];
  const samples = modeSamples(config.mode, config.samples);
  const allPrompts = [...config.prompts, ...config.indirectPrompts];

  for (const prompt of allPrompts) {
    const res = await provider.ask(prompt, { model: config.model, samples });
    runs.push(res);
    for (const answer of res.responses) {
      if (!detectMention(answer, brandNames).matched) {
        sentimentLabels.push("absent");
        continue;
      }
      const s = await judgeSentiment(provider, { model: config.model, brand: config.brand, answer });
      sentimentLabels.push(s.label);
      const a = await judgeAccuracy(provider, {
        model: config.model,
        brand: config.brand,
        answer,
        ...(config.knowledgePack ? { knowledgePack: config.knowledgePack } : {}),
      });
      accuracyClaims.push(...a.claims);
    }
  }

  return computeReport({
    brand: config.brand,
    engine: providerEngineLabel(config.provider),
    model: config.model,
    generatedAt: opts.now ?? new Date().toISOString(),
    brandNames,
    competitors: config.competitors,
    runs,
    sentimentLabels,
    accuracyClaims,
    indirectPrompts: config.indirectPrompts,
  });
}

// ── Rendering ────────────────────────────────────────────────────────────────
export interface RenderOptions {
  /** Include a jusBrandMax footer (off by default — reports are white-label). */
  footer?: boolean;
  /** Report depth (default "standard"). quick = headline; detailed = + per-prompt drill-down. */
  mode?: ReportMode;
}

const pct = (x: number): string => `${(x * 100).toFixed(0)}%`;

export function renderMarkdown(r: BrandReport, opts: RenderOptions = {}): string {
  const mode: ReportMode = opts.mode ?? "standard";
  const d = r.dimensions;
  const lines: string[] = [
    `# Brand Visibility on ${r.engine} — ${r.brand}`,
    "",
    `**Overall: ${r.overall}/100** · model \`${r.model}\` · ${r.promptCount} prompts · ${r.sampleCount} samples · ${mode} mode · confidence: ${r.confidence.level} · ${r.generatedAt}`,
    "",
  ];

  // Executive summary (standard + detailed) — fully data-derived narrative.
  if (mode !== "quick") {
    lines.push("## Executive summary", "", r.summary, "");
  }

  lines.push(
    "## Dimensions",
    "",
    "| Dimension | Score |",
    "|---|---|",
    `| Presence (visibility) | ${pct(d.presence.visibility)} |`,
    `| Share of Voice | ${pct(d.shareOfVoice.brandShare)} |`,
    `| Prominence (first-mention rate) | ${pct(d.prominence.firstMentionRate)} |`,
    `| Sentiment (net) | ${d.sentiment.net.toFixed(2)} |`,
    `| Accuracy | ${pct(d.accuracy.accuracy)} (${d.accuracy.contradicted} contradicted, ${d.accuracy.unsupported} unsupported) |`,
    "",
  );

  // Detailed: per-dimension interpretation.
  if (mode === "detailed") {
    lines.push("### What this means", "", ...interpretDimensions(r).map((s) => `- ${s}`), "");
  }

  // Intent breakdown (standard + detailed).
  if (mode !== "quick" && r.intentBreakdown.indirect.promptCount > 0) {
    lines.push(
      "## Intent breakdown",
      "",
      "Where category demand forms vs. where you show up.",
      "",
      "| Intent | Prompts | Visibility |",
      "|---|---|---|",
      `| Direct ("best <category>") | ${r.intentBreakdown.direct.promptCount} | ${pct(r.intentBreakdown.direct.visibility)} |`,
      `| Indirect (problem / jobs-to-be-done) | ${r.intentBreakdown.indirect.promptCount} | ${pct(r.intentBreakdown.indirect.visibility)} |`,
      "",
    );
  }

  // Action Center (standard = top 3, detailed = all with rationale).
  if (mode !== "quick" && r.recommendations.length > 0) {
    const recs = mode === "detailed" ? r.recommendations : r.recommendations.slice(0, 3);
    lines.push("## Recommended actions", "");
    recs.forEach((rec, i) => {
      lines.push(`${i + 1}. **${rec.title}** _(impact: ${rec.impact}, effort: ${rec.effort})_`);
      if (mode === "detailed") lines.push(`   ${rec.rationale}`);
    });
    lines.push("");
  }

  if (mode !== "quick") {
    lines.push(
      "## Competitor leaderboard",
      "",
      "| Rank | Brand | Share | Mentions |",
      "|---|---|---|---|",
      ...r.leaderboard.map(
        (e, i) =>
          `| ${i + 1} | ${e.isBrand ? `**${e.name}**` : e.name} | ${pct(e.share)} | ${e.mentioningSamples} |`,
      ),
      "",
      "## Gaps (competitors win, you're absent)",
      "",
      r.gaps.length === 0
        ? "_No hard gaps — the brand appears wherever competitors do._"
        : r.gaps.map((g) => `- **${g.prompt}** → ${g.competitorsPresent.join(", ")}`).join("\n"),
      "",
    );
  }

  // Detailed: evidence quotes + per-prompt drill-down.
  if (mode === "detailed") {
    lines.push("## Evidence (what the model actually said)", "");
    if (r.evidence.length === 0) {
      lines.push("_No quotes captured._", "");
    } else {
      for (const e of r.evidence) {
        lines.push(`- **${e.prompt}**`, `  > ${e.quote}${e.brand ? "" : "  _(brand absent — this is what appeared instead)_"}`);
      }
      lines.push("");
    }
    lines.push(
      "## Per-prompt visibility",
      "",
      "| Prompt | Visibility |",
      "|---|---|",
      ...r.dimensions.presence.perPrompt.map((p) => `| ${p.prompt} | ${pct(p.rate)} |`),
      "",
    );
  }

  if (opts.footer) {
    lines.push("---", "_Generated by jusBrandMax — MIT, open-source brand visibility for Claude._");
  }
  return lines.join("\n");
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A complete, styled, standalone HTML report — shareable, zero-dependency. */
export function renderHtml(r: BrandReport, opts: RenderOptions = {}): string {
  const d = r.dimensions;
  const scoreColor = r.overall >= 70 ? "#1a7f37" : r.overall >= 40 ? "#9a6700" : "#cf222e";
  const dimRows = [
    ["Presence (visibility)", pct(d.presence.visibility)],
    ["Share of Voice", pct(d.shareOfVoice.brandShare)],
    ["Prominence (first-mention rate)", pct(d.prominence.firstMentionRate)],
    ["Sentiment (net)", d.sentiment.net.toFixed(2)],
    ["Accuracy", `${pct(d.accuracy.accuracy)} (${d.accuracy.contradicted} contradicted, ${d.accuracy.unsupported} unsupported)`],
  ]
    .map(([k, v]) => `<tr><td>${esc(k!)}</td><td>${esc(v!)}</td></tr>`)
    .join("");
  const boardRows = r.leaderboard
    .map(
      (e, i) =>
        `<tr><td>${i + 1}</td><td>${e.isBrand ? `<strong>${esc(e.name)}</strong>` : esc(e.name)}</td><td>${pct(e.share)}</td></tr>`,
    )
    .join("");
  const recItems = r.recommendations
    .map((rec) => `<li><strong>${esc(rec.title)}</strong> <em>(impact ${rec.impact}, effort ${rec.effort})</em><br>${esc(rec.rationale)}</li>`)
    .join("");
  const evidenceItems = r.evidence
    .map((e) => `<li><strong>${esc(e.prompt)}</strong><blockquote>${esc(e.quote)}${e.brand ? "" : " <em>(brand absent)</em>"}</blockquote></li>`)
    .join("");
  const footer = opts.footer
    ? `<footer style="margin-top:2rem;color:#666;font-size:.85rem">Generated by jusBrandMax — MIT, open-source brand visibility for Claude.</footer>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Brand Visibility on ${esc(r.engine)} — ${esc(r.brand)}</title>
<style>
 body{font:16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;color:#1c1c1c}
 h1{font-size:1.6rem;margin-bottom:.25rem} h2{margin-top:2rem;border-bottom:1px solid #eee;padding-bottom:.25rem}
 .score{font-size:2.6rem;font-weight:700;color:${scoreColor}} .meta{color:#666;font-size:.9rem}
 table{border-collapse:collapse;width:100%;margin:.5rem 0} td,th{border:1px solid #e3e3e3;padding:.5rem .6rem;text-align:left}
 blockquote{margin:.3rem 0 .8rem;padding:.2rem .8rem;border-left:3px solid #ddd;color:#444}
 ul{padding-left:1.2rem}
</style></head><body>
<h1>Brand Visibility on ${esc(r.engine)} — ${esc(r.brand)}</h1>
<p class="meta">model <code>${esc(r.model)}</code> · ${r.promptCount} prompts · ${r.sampleCount} samples · confidence: ${r.confidence.level} · ${esc(r.generatedAt)}</p>
<p class="score">${r.overall}<span style="font-size:1rem;color:#666">/100</span></p>
<h2>Executive summary</h2><p>${esc(r.summary)}</p>
<h2>Dimensions</h2><table><thead><tr><th>Dimension</th><th>Score</th></tr></thead><tbody>${dimRows}</tbody></table>
<h2>Intent breakdown</h2><table><thead><tr><th>Intent</th><th>Prompts</th><th>Visibility</th></tr></thead><tbody>
<tr><td>Direct ("best &lt;category&gt;")</td><td>${r.intentBreakdown.direct.promptCount}</td><td>${pct(r.intentBreakdown.direct.visibility)}</td></tr>
<tr><td>Indirect (problem-led)</td><td>${r.intentBreakdown.indirect.promptCount}</td><td>${pct(r.intentBreakdown.indirect.visibility)}</td></tr>
</tbody></table>
<h2>Recommended actions</h2><ol>${recItems || "<li>No actions — strong across the board.</li>"}</ol>
<h2>Competitor leaderboard</h2><table><thead><tr><th>#</th><th>Brand</th><th>Share</th></tr></thead><tbody>${boardRows}</tbody></table>
<h2>Evidence</h2><ul>${evidenceItems || "<li>No quotes captured.</li>"}</ul>
${footer}
</body></html>`;
}
