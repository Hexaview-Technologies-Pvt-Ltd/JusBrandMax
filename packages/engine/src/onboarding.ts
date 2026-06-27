/**
 * 10-second onboarding — given a brand name (and a one-line description), have the
 * model propose the prompt universe (direct + indirect intent) and likely
 * competitors, so the user never faces a blank config. Provider-backed; returns
 * plain data the CLI/Cowork write into a config.
 */
import type { ClaudeProvider } from "./provider.js";
import { extractJson } from "./judge.js";

export interface SetupSuggestion {
  prompts: string[];
  indirectPrompts: string[];
  competitors: string[];
}

const SYSTEM =
  "You help set up a brand-visibility audit. Given a brand and what it does, propose the questions a buyer would ask an AI assistant in that category, plus likely competitors. " +
  'Respond with ONLY JSON: {"prompts": [direct "best <category>" buyer questions], "indirectPrompts": [problem/jobs-to-be-done questions that drive the category without naming it], "competitors": [competitor brand names]}. ' +
  "Do not include the brand itself in competitors. 8-12 prompts, 5-8 indirect, 3-6 competitors.";

const toStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];

export async function generatePromptUniverse(
  provider: ClaudeProvider,
  opts: { brand: string; description?: string; model: string },
): Promise<SetupSuggestion> {
  const prompt =
    `Brand: ${opts.brand}\n` +
    (opts.description ? `What it does: ${opts.description}\n` : "") +
    `\nPropose the audit setup as JSON.`;
  const res = await provider.ask(prompt, { model: opts.model, system: SYSTEM, samples: 1 });
  const parsed = extractJson<{ prompts?: unknown; indirectPrompts?: unknown; competitors?: unknown }>(
    res.responses[0] ?? "",
  );
  return {
    prompts: toStrings(parsed.prompts),
    indirectPrompts: toStrings(parsed.indirectPrompts),
    competitors: toStrings(parsed.competitors),
  };
}
