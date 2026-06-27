/**
 * Claude provider — the only thing in the engine that talks to the Anthropic API.
 *
 * Bring-your-own-key: the client reads ANTHROPIC_API_KEY from the environment by
 * default and never persists it. `ask()` supports repeated sampling (`samples`)
 * so scorers can compute statistical confidence (feature #14).
 *
 * We deliberately do NOT enable extended thinking — we want Claude's ordinary
 * user-facing answer, because that is what real users see and what we measure.
 */
import Anthropic from "@anthropic-ai/sdk";

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

/** The slice of the Anthropic client the provider uses — injectable for tests. */
export interface MessagesClient {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      system?: string;
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    }): Promise<MessageResponse>;
  };
}

export interface ClaudeProvider {
  ask(prompt: string, opts: AskOptions): Promise<AskResult>;
}

export interface CreateProviderOptions {
  apiKey?: string;
  /** Inject a fake client in tests; falls back to a real Anthropic client. */
  client?: MessagesClient;
}

const DEFAULT_MAX_TOKENS = 4096;

/** Concatenate the text blocks of a Messages response, ignoring other block types. */
export function extractText(res: MessageResponse): string {
  return res.content
    .filter((b): b is { type: string; text: string } => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("");
}

export function createClaudeProvider(options: CreateProviderOptions = {}): ClaudeProvider {
  const client: MessagesClient =
    options.client ??
    (new Anthropic({
      apiKey: options.apiKey ?? process.env["ANTHROPIC_API_KEY"],
    }) as unknown as MessagesClient);

  return {
    async ask(prompt: string, opts: AskOptions): Promise<AskResult> {
      const samples = Math.max(1, opts.samples ?? 1);
      const calls = Array.from({ length: samples }, () =>
        client.messages.create({
          model: opts.model,
          max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
          ...(opts.system ? { system: opts.system } : {}),
          messages: [{ role: "user", content: prompt }],
        }),
      );
      const results = await Promise.all(calls);
      return {
        prompt,
        model: opts.model,
        responses: results.map(extractText),
      };
    },
  };
}
