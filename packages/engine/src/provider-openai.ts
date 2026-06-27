/**
 * OpenAI-compatible provider (P2) — measure Brand Visibility on engines that
 * speak the OpenAI Chat Completions API: OpenAI, OpenRouter, Together, Groq, and
 * local servers (Ollama / llama.cpp). Dependency-free: uses global `fetch`.
 *
 * Implements the same `ask()` contract as the Claude provider, so the whole
 * scoring/report pipeline is engine-agnostic. Claude remains the default (P1).
 */
import type { AskOptions, AskResult, ClaudeProvider } from "./provider.js";

export interface OpenAICompatibleOptions {
  apiKey?: string | undefined;
  /** Defaults to OPENAI_BASE_URL or https://api.openai.com/v1. */
  baseURL?: string | undefined;
  /** Extra headers (e.g. OpenRouter's HTTP-Referer). */
  headers?: Record<string, string>;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

/** Pull the assistant text from a Chat Completions response. */
export function extractOpenAIText(res: ChatCompletionResponse): string {
  return res.choices?.[0]?.message?.content ?? "";
}

const DEFAULT_MAX_TOKENS = 4096;

export function createOpenAICompatibleProvider(
  options: OpenAICompatibleOptions = {},
): ClaudeProvider {
  const baseURL = (options.baseURL ?? process.env["OPENAI_BASE_URL"] ?? "https://api.openai.com/v1").replace(
    /\/+$/,
    "",
  );
  const apiKey = options.apiKey ?? process.env["OPENAI_API_KEY"];
  const doFetch = options.fetchImpl ?? fetch;

  return {
    async ask(prompt: string, opts: AskOptions): Promise<AskResult> {
      const samples = Math.max(1, opts.samples ?? 1);
      const messages: Array<{ role: string; content: string }> = [];
      if (opts.system) messages.push({ role: "system", content: opts.system });
      messages.push({ role: "user", content: prompt });

      const calls = Array.from({ length: samples }, async () => {
        const res = await doFetch(`${baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
            ...(options.headers ?? {}),
          },
          body: JSON.stringify({
            model: opts.model,
            max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
            messages,
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`OpenAI-compatible request failed: ${res.status} ${text.slice(0, 200)}`);
        }
        const data = (await res.json()) as ChatCompletionResponse;
        return extractOpenAIText(data);
      });

      return { prompt, model: opts.model, responses: await Promise.all(calls) };
    },
  };
}
