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

  return {
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
    overall: Math.round(overall * 10) / 10,
  };
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
    `**Overall: ${r.overall}/100** · model \`${r.model}\` · ${r.promptCount} prompts · ${r.sampleCount} samples · ${mode} mode · ${r.generatedAt}`,
    "",
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
  ];

  // Intent breakdown (standard + detailed): direct vs indirect-intent visibility.
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

  // Detailed: per-prompt visibility drill-down.
  if (mode === "detailed") {
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

export function renderHtml(r: BrandReport, opts: RenderOptions = {}): string {
  const d = r.dimensions;
  const rows = [
    ["Presence (visibility)", pct(d.presence.visibility)],
    ["Share of Voice", pct(d.shareOfVoice.brandShare)],
    ["Prominence (first-mention rate)", pct(d.prominence.firstMentionRate)],
    ["Sentiment (net)", d.sentiment.net.toFixed(2)],
    ["Accuracy", pct(d.accuracy.accuracy)],
  ]
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join("");
  const footer = opts.footer
    ? `<footer>Generated by jusBrandMax — MIT, open-source brand visibility for Claude.</footer>`
    : "";
  return [
    "<!doctype html>",
    `<html><head><meta charset="utf-8"><title>Brand Visibility on Claude — ${r.brand}</title></head>`,
    "<body>",
    `<h1>Brand Visibility on Claude — ${r.brand}</h1>`,
    `<p><strong>Overall: ${r.overall}/100</strong> · model <code>${r.model}</code> · ${r.promptCount} prompts · ${r.sampleCount} samples · ${r.generatedAt}</p>`,
    `<table border="1" cellpadding="6"><thead><tr><th>Dimension</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table>`,
    footer,
    "</body></html>",
  ].join("\n");
}
