/**
 * Provider selection — maps a BrandConfig's `provider` to a concrete LLM provider.
 * Claude is the default (P1); OpenAI-compatible engines are P2. Both implement the
 * same `ask()` contract, so callers (CLI, Cowork) stay engine-agnostic.
 */
import { createClaudeProvider, type ClaudeProvider } from "./provider.js";
import { createOpenAICompatibleProvider } from "./provider-openai.js";
import type { ProviderName } from "./config.js";

export function providerEngineLabel(provider: ProviderName): string {
  return provider === "openai" ? "OpenAI" : "Claude";
}

export function keyEnvFor(provider: ProviderName): string {
  return provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
}

export function createProviderFor(
  config: { provider?: ProviderName; baseURL?: string | undefined },
  env: Record<string, string | undefined>,
): ClaudeProvider {
  if (config.provider === "openai") {
    return createOpenAICompatibleProvider({
      apiKey: env["OPENAI_API_KEY"],
      baseURL: config.baseURL ?? env["OPENAI_BASE_URL"],
    });
  }
  return createClaudeProvider({
    apiKey: env["ANTHROPIC_API_KEY"],
    baseURL: config.baseURL ?? env["ANTHROPIC_BASE_URL"],
  });
}
