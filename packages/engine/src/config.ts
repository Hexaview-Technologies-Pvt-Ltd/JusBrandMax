/**
 * Brand configuration — the input that defines a Brand Visibility on Claude run.
 *
 * `parseBrandConfig` / `resolveBrandConfig` are pure (easy to unit-test);
 * `loadBrandConfig` is the thin filesystem wrapper used by the CLI.
 */
import { readFileSync } from "node:fs";

/** Which LLM engine to measure. Claude is the default (P1); OpenAI-compatible is P2. */
export type ProviderName = "anthropic" | "openai";

/** Fully-resolved config with all defaults applied. */
export interface BrandConfig {
  /** The brand whose visibility we measure. */
  brand: string;
  /** Alternate spellings/product names that also count as a mention. */
  aliases: string[];
  /** Competitor brands to measure Share of Voice against. */
  competitors: string[];
  /** The category prompts Claude is asked. */
  prompts: string[];
  /** Which engine to measure (default "anthropic" → Claude). */
  provider: ProviderName;
  /** Override the API base URL (OpenAI-compatible engines, self-hosted, etc.). */
  baseURL?: string;
  /** Model under test (itself a measured dimension — see feature #58). */
  model: string;
  /** Repeated samples per prompt, for statistical confidence (feature #14). */
  samples: number;
  /** Optional persona to condition prompts with (feature #24). */
  persona?: string;
  /** Optional language to run the prompt set in (feature #59). */
  language?: string;
  /** Optional path to canonical brand facts (Brand Knowledge Pack, feature #45). */
  knowledgePack?: string;
}

/** Raw, partially-specified input (e.g. parsed from JSON). */
export interface BrandConfigInput {
  brand?: string;
  aliases?: string[];
  competitors?: string[];
  prompts?: string[];
  provider?: ProviderName;
  baseURL?: string;
  model?: string;
  samples?: number;
  persona?: string;
  language?: string;
  knowledgePack?: string;
}

export const DEFAULT_MODEL = "claude-opus-4-8";
export const DEFAULT_SAMPLES = 3;

function cleanList(values: string[] | undefined): string[] {
  return (values ?? []).map((s) => s.trim()).filter(Boolean);
}

/** Validate and apply defaults, returning a fully-resolved BrandConfig. */
export function resolveBrandConfig(input: BrandConfigInput): BrandConfig {
  if (typeof input.brand !== "string" || !input.brand.trim()) {
    throw new Error("BrandConfig: 'brand' is required (the brand name to measure).");
  }
  if (!Array.isArray(input.prompts) || cleanList(input.prompts).length === 0) {
    throw new Error("BrandConfig: 'prompts' must be a non-empty array of category prompts.");
  }
  const samples = input.samples ?? DEFAULT_SAMPLES;
  if (!Number.isInteger(samples) || samples < 1) {
    throw new Error("BrandConfig: 'samples' must be a positive integer.");
  }
  const provider = input.provider ?? "anthropic";
  if (provider !== "anthropic" && provider !== "openai") {
    throw new Error("BrandConfig: 'provider' must be 'anthropic' or 'openai'.");
  }

  return {
    brand: input.brand.trim(),
    aliases: cleanList(input.aliases),
    competitors: cleanList(input.competitors),
    prompts: cleanList(input.prompts),
    provider,
    ...(input.baseURL ? { baseURL: input.baseURL.trim() } : {}),
    model: input.model?.trim() || DEFAULT_MODEL,
    samples,
    ...(input.persona ? { persona: input.persona.trim() } : {}),
    ...(input.language ? { language: input.language.trim() } : {}),
    ...(input.knowledgePack ? { knowledgePack: input.knowledgePack.trim() } : {}),
  };
}

/** Parse a JSON string into a resolved BrandConfig. */
export function parseBrandConfig(json: string): BrandConfig {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (err) {
    throw new Error(`BrandConfig: invalid JSON — ${(err as Error).message}`);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("BrandConfig: top-level value must be a JSON object.");
  }
  return resolveBrandConfig(data as BrandConfigInput);
}

/** Read and parse a brand config file from disk. */
export function loadBrandConfig(path: string): BrandConfig {
  return parseBrandConfig(readFileSync(path, "utf8"));
}
