/**
 * Real end-to-end: drives the genuine Anthropic SDK over HTTP against a local
 * Anthropic-compatible stub server, through the real CLI (no injected provider).
 *
 * This exercises every layer — CLI → real createClaudeProvider → Anthropic SDK →
 * HTTP → response parsing → all six scorers → report → SQLite history → deltas —
 * with the sole exception of Anthropic's own servers. It needs no paid API key.
 */
import { describe, it, expect } from "vitest";
import { createServer, type Server } from "node:http";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "./cli.js";

function startStub(): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server: Server = createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        let system = "";
        try {
          const parsed = JSON.parse(body) as { system?: unknown };
          system = typeof parsed.system === "string" ? parsed.system : "";
        } catch {
          /* ignore */
        }
        let text = "Acme is the best CRM, ahead of Beta.";
        if (system.includes("portrays")) text = '{"label":"positive","rationale":"good"}';
        else if (system.includes("fact-check"))
          text = '{"claims":[{"claim":"Acme is great","verdict":"supported"}]}';

        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            id: "msg_stub",
            type: "message",
            role: "assistant",
            model: "claude-opus-4-8",
            content: [{ type: "text", text }],
            stop_reason: "end_turn",
            usage: { input_tokens: 1, output_tokens: 1 },
          }),
        );
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}

describe("CLI report — real Anthropic SDK HTTP path (stub server)", () => {
  it(
    "produces a 6-dimension report and shows deltas on the second run",
    async () => {
      const stub = await startStub();
      try {
        const cwd = mkdtempSync(join(tmpdir(), "jbm-e2e-"));
        writeFileSync(
          join(cwd, "brand.config.json"),
          JSON.stringify({ brand: "Acme", competitors: ["Beta"], prompts: ["best crm?"], samples: 1 }),
        );
        const env = { ANTHROPIC_API_KEY: "test", ANTHROPIC_BASE_URL: stub.url };

        const code = await runCli(["report"], {
          cwd,
          stdout: () => {},
          stderr: () => {},
          env,
          now: () => "2026-06-27T00:00:00Z",
        });
        expect(code).toBe(0);

        const md = readFileSync(join(cwd, "brand-report.md"), "utf8");
        for (const dim of ["Presence (visibility)", "Share of Voice", "Prominence", "Sentiment", "Accuracy"]) {
          expect(md).toContain(dim);
        }

        const out2: string[] = [];
        await runCli(["report"], {
          cwd,
          stdout: (s) => out2.push(s),
          stderr: (s) => out2.push(s),
          env,
          now: () => "2026-06-27T01:00:00Z",
        });
        expect(out2.join("\n")).toMatch(/Since last run/);
      } finally {
        await stub.close();
      }
    },
    20000,
  );
});
