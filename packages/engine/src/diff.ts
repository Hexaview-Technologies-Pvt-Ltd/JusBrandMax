/**
 * Cross-engine (or over-time) diff — compare two reports for the same brand and
 * show where it wins and loses. The "you win on one engine, you're invisible on
 * another" view. Pure functions.
 */
import type { BrandReport } from "./report.js";

export interface DimensionDelta {
  name: string;
  a: number;
  b: number;
  delta: number;
}

export interface ReportDiff {
  brand: string;
  a: { label: string; overall: number };
  b: { label: string; overall: number };
  dimensions: DimensionDelta[];
}

const labelOf = (r: BrandReport): string => `${r.engine} (${r.generatedAt})`;

export function diffReports(a: BrandReport, b: BrandReport): ReportDiff {
  const dim = (name: string, av: number, bv: number): DimensionDelta => ({
    name,
    a: av,
    b: bv,
    delta: Math.round((bv - av) * 1000) / 1000,
  });
  return {
    brand: a.brand,
    a: { label: labelOf(a), overall: a.overall },
    b: { label: labelOf(b), overall: b.overall },
    dimensions: [
      dim("Presence", a.dimensions.presence.visibility, b.dimensions.presence.visibility),
      dim("Share of Voice", a.dimensions.shareOfVoice.brandShare, b.dimensions.shareOfVoice.brandShare),
      dim("Prominence", a.dimensions.prominence.firstMentionRate, b.dimensions.prominence.firstMentionRate),
      dim("Sentiment", a.dimensions.sentiment.net, b.dimensions.sentiment.net),
      dim("Accuracy", a.dimensions.accuracy.accuracy, b.dimensions.accuracy.accuracy),
    ],
  };
}

const pct = (x: number): string => `${Math.round(x * 100)}%`;

export function renderDiffMarkdown(a: BrandReport, b: BrandReport): string {
  const diff = diffReports(a, b);
  const lines: string[] = [
    `# Cross-engine diff — ${diff.brand}`,
    "",
    `**A:** ${diff.a.label} — overall ${diff.a.overall}/100`,
    `**B:** ${diff.b.label} — overall ${diff.b.overall}/100`,
    "",
    "| Dimension | A | B | Δ (B−A) |",
    "|---|---|---|---|",
    `| Overall | ${diff.a.overall} | ${diff.b.overall} | ${(diff.b.overall - diff.a.overall).toFixed(1)} |`,
    ...diff.dimensions.map((d) => {
      const fmt = d.name === "Sentiment" ? (x: number) => x.toFixed(2) : pct;
      const arrow = d.delta > 0 ? "▲" : d.delta < 0 ? "▼" : "·";
      return `| ${d.name} | ${fmt(d.a)} | ${fmt(d.b)} | ${arrow} ${fmt(Math.abs(d.delta))} |`;
    }),
    "",
  ];
  return lines.join("\n");
}
