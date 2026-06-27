/**
 * LLM-as-judge scorers: sentiment (#7) and accuracy/hallucination (#9).
 *
 * The judge *orchestration* calls Claude; the *aggregation* is pure and unit-
 * tested. Judge calls go through the same ClaudeProvider, so tests inject a fake
 * provider and never hit the network. Claude is asked to return JSON, which we
 * extract tolerantly (it may wrap output in prose or code fences).
 */
import type { ClaudeProvider } from "./provider.js";

/** Pull the first JSON object/array out of a possibly-noisy model response. */
export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const opener = candidate.match(/[[{]/);
  if (!opener || opener.index === undefined) {
    throw new Error("extractJson: no JSON object or array found in response");
  }
  const start = opener.index;
  const close = opener[0] === "{" ? "}" : "]";
  const end = candidate.lastIndexOf(close);
  if (end < start) throw new Error("extractJson: unbalanced JSON in response");
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

// ── Sentiment & Positioning (feature #7) ─────────────────────────────────────
export type SentimentLabel = "positive" | "neutral" | "negative" | "absent";

export interface SentimentResult {
  label: SentimentLabel;
  rationale: string;
}

export function normalizeSentiment(value: unknown): SentimentLabel {
  const s = String(value ?? "").trim().toLowerCase();
  if (s.startsWith("pos")) return "positive";
  if (s.startsWith("neg")) return "negative";
  if (s.startsWith("abs")) return "absent";
  return "neutral";
}

const SENTIMENT_SYSTEM =
  "You grade how an AI answer portrays a specific brand. " +
  'Respond with ONLY a JSON object: {"label": "positive|neutral|negative|absent", "rationale": "<one sentence>"}. ' +
  'Use "absent" if the brand is not mentioned at all.';

export async function judgeSentiment(
  provider: ClaudeProvider,
  opts: { model: string; brand: string; answer: string },
): Promise<SentimentResult> {
  const prompt =
    `Brand: ${opts.brand}\n\nAI answer:\n"""\n${opts.answer}\n"""\n\n` +
    `How does this answer portray ${opts.brand}? Return the JSON object only.`;
  const res = await provider.ask(prompt, { model: opts.model, system: SENTIMENT_SYSTEM, samples: 1 });
  const parsed = extractJson<{ label?: unknown; rationale?: unknown }>(res.responses[0] ?? "");
  return {
    label: normalizeSentiment(parsed.label),
    rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
  };
}

export interface SentimentSummary {
  counts: Record<SentimentLabel, number>;
  /** (positive − negative) / mentions, in [-1, 1]; "absent" samples are excluded. */
  net: number;
}

export function aggregateSentiment(labels: SentimentLabel[]): SentimentSummary {
  const counts: Record<SentimentLabel, number> = { positive: 0, neutral: 0, negative: 0, absent: 0 };
  for (const l of labels) counts[l] += 1;
  const considered = counts.positive + counts.neutral + counts.negative;
  return {
    counts,
    net: considered ? (counts.positive - counts.negative) / considered : 0,
  };
}

// ── Accuracy / hallucination (feature #9) ────────────────────────────────────
export type ClaimVerdict = "supported" | "unsupported" | "contradicted";

export interface ClaimCheck {
  claim: string;
  verdict: ClaimVerdict;
}

export interface AccuracyResult {
  claims: ClaimCheck[];
}

export function normalizeVerdict(value: unknown): ClaimVerdict {
  const s = String(value ?? "").trim().toLowerCase();
  if (s.startsWith("contra")) return "contradicted";
  if (s.startsWith("sup")) return "supported";
  return "unsupported";
}

const ACCURACY_SYSTEM =
  "You fact-check the factual claims an AI answer makes about a specific brand. " +
  'Respond with ONLY a JSON object: {"claims": [{"claim": "<text>", "verdict": "supported|unsupported|contradicted"}]}. ' +
  '"supported" = backed by the canonical facts; "contradicted" = conflicts with them; ' +
  '"unsupported" = stated as fact but not verifiable from the canonical facts.';

export async function judgeAccuracy(
  provider: ClaudeProvider,
  opts: { model: string; brand: string; answer: string; knowledgePack?: string },
): Promise<AccuracyResult> {
  const facts = opts.knowledgePack?.trim()
    ? opts.knowledgePack.trim()
    : "(no canonical facts provided — flag only internally inconsistent or implausible claims)";
  const prompt =
    `Brand: ${opts.brand}\n\nCanonical facts:\n${facts}\n\n` +
    `AI answer:\n"""\n${opts.answer}\n"""\n\n` +
    `List each factual claim the answer makes about ${opts.brand} and judge it. Return the JSON object only.`;
  const res = await provider.ask(prompt, { model: opts.model, system: ACCURACY_SYSTEM, samples: 1 });
  const parsed = extractJson<{ claims?: Array<{ claim?: unknown; verdict?: unknown }> }>(
    res.responses[0] ?? "",
  );
  const claims: ClaimCheck[] = Array.isArray(parsed.claims)
    ? parsed.claims
        .map((c) => ({ claim: String(c.claim ?? "").trim(), verdict: normalizeVerdict(c.verdict) }))
        .filter((c) => c.claim.length > 0)
    : [];
  return { claims };
}

export interface AccuracySummary {
  total: number;
  supported: number;
  unsupported: number;
  contradicted: number;
  /** supported / total claims; 1.0 when there are no claims to check. */
  accuracy: number;
}

export function aggregateAccuracy(claims: ClaimCheck[]): AccuracySummary {
  let supported = 0;
  let unsupported = 0;
  let contradicted = 0;
  for (const c of claims) {
    if (c.verdict === "supported") supported += 1;
    else if (c.verdict === "contradicted") contradicted += 1;
    else unsupported += 1;
  }
  const total = claims.length;
  return {
    total,
    supported,
    unsupported,
    contradicted,
    accuracy: total ? supported / total : 1,
  };
}
