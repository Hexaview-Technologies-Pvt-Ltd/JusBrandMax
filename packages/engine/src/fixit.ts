/**
 * Close the loop — given a finding (a gap, a hallucination, an intent miss), have
 * the model draft the publishable fix (a page, FAQ, or correction). The user
 * ships it, re-runs the report, and `watch` shows the before/after lift. This is
 * the measure → fix → re-measure → prove loop. Provider-backed.
 */
import type { ClaudeProvider } from "./provider.js";

const SYSTEM =
  "You are a brand content strategist. Given a brand and a specific brand-visibility finding, draft publishable, factual content that addresses it so that an AI assistant would surface the brand for the relevant questions. " +
  "Return Markdown only: a clear title, a short intent line, and the body (page copy, FAQ entries, or a factual correction as appropriate). Be accurate and specific; do not invent facts about the brand — use placeholders like [your specific detail] where the brand must supply specifics.";

export async function draftFix(
  provider: ClaudeProvider,
  opts: { brand: string; model: string; finding: string },
): Promise<string> {
  const prompt =
    `Brand: ${opts.brand}\n\nFinding to address:\n${opts.finding}\n\n` +
    `Draft the content that would close this gap. Markdown only.`;
  const res = await provider.ask(prompt, { model: opts.model, system: SYSTEM, samples: 1 });
  return res.responses[0] ?? "";
}
