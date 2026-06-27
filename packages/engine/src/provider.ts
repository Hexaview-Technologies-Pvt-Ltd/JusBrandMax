/**
 * Claude provider — the only thing in the engine that talks to the Anthropic API.
 *
 * ZERO DEPENDENCIES BY DESIGN. We call the Messages API over the Node standard
 * library's global `fetch` instead of the Anthropic SDK, so the shipped package
 * has nothing for Enterprise IT to audit and no supply chain. Bring-your-own-key:
 * reads ANTHROPIC_API_KEY from the environment by default and never persists it.
 *
 * We deliberately do NOT enable extended thinking — we want Claude's ordinary
 * user-facing answer, because that is what real users see and what we measure.
 */

export interface AskOptions {
  /** Model under test, e.g. "claude-opus-4-8". */
  model: string;
  /** Number of independent samples to draw for this prompt (default 1). */
  samples?: number;
  /** Optional system prompt (used by judge/scorer calls, not by measurement). */
  system?: string;
  /** Max output tokens per call. */
  maxTokens?: number;
}

export interface AskResult {
  prompt: string;
  model: string;
  /** One raw text answer per sample. */
  responses: string[];
}

/** Minimal shape of an Anthropic Messages response we depend on. */
export interface MessageResponse {
  content: Array<{ type: string; text?: string }>;
}

export interface ClaudeProvider {
  ask(prompt: string, opts: AskOptions): Promise<AskResult>;
}

/** Engine-agnostic alias — Claude and OpenAI-compatible providers share this contract. */
export type LlmProvider = ClaudeProvider;

export interface CreateProviderOptions {
  apiKey?: string | undefined;
  /** Override the API base URL (also read from ANTHROPIC_BASE_URL). */
  baseURL?: string | undefined;
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

const DEFAULT_MAX_TOKENS = 4096;
const ANTHROPIC_VERSION = "2023-06-01";

/** Concatenate the text blocks of a Messages response, ignoring other block types. */
export function extractText(res: MessageResponse): string {
  return res.content
    .filter((b): b is { type: string; text: string } => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("");
}

export function createClaudeProvider(options: CreateProviderOptions = {}): ClaudeProvider {
  const baseURL = (options.baseURL ?? process.env["ANTHROPIC_BASE_URL"] ?? "https://api.anthropic.com").replace(
    /\/+$/,
    "",
  );
  const apiKey = options.apiKey ?? process.env["ANTHROPIC_API_KEY"];
  const doFetch = options.fetchImpl ?? fetch;

  return {
    async ask(prompt: string, opts: AskOptions): Promise<AskResult> {
      const samples = Math.max(1, opts.samples ?? 1);
      const calls = Array.from({ length: samples }, async () => {
        const res = await doFetch(`${baseURL}/v1/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey ?? "",
            "anthropic-version": ANTHROPIC_VERSION,
          },
          body: JSON.stringify({
            model: opts.model,
            max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
            ...(opts.system ? { system: opts.system } : {}),
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Anthropic request failed: ${res.status} ${text.slice(0, 200)}`);
        }
        return extractText((await res.json()) as MessageResponse);
      });
      return { prompt, model: opts.model, responses: await Promise.all(calls) };
    },
  };
}
