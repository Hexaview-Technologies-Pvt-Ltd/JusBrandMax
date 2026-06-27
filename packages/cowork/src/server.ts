/**
 * jusBrandMax Cowork MCP server — ZERO DEPENDENCIES.
 *
 * Implements the Model Context Protocol stdio transport (newline-delimited
 * JSON-RPC 2.0) by hand over the Node standard library — no `@modelcontextprotocol/sdk`,
 * no `zod`. This keeps the whole product auditable and supply-chain-free for
 * Enterprise IT. `dispatch` is pure and unit-tested; `startStdio` is the thin
 * stdin/stdout wiring.
 */
import { createInterface } from "node:readline";
import {
  runBrandReportTool,
  getHistoryTool,
  listCompetitorsTool,
  listPacksTool,
  defaultToolDeps,
  type ToolDeps,
  type RunBrandReportArgs,
} from "./tools.js";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "jusbrandmax", version: "0.1.0" };

export const TOOLS = [
  {
    name: "run_brand_report",
    description:
      "Measure how visible a brand is on Claude across category prompts: presence, share of voice, prominence, sentiment, and factual accuracy. Requires ANTHROPIC_API_KEY in the server environment.",
    inputSchema: {
      type: "object",
      properties: {
        brand: { type: "string", description: "The brand to measure." },
        prompts: { type: "array", items: { type: "string" }, description: "Direct-intent category questions." },
        indirectPrompts: {
          type: "array",
          items: { type: "string" },
          description: "Indirect-intent (problem / jobs-to-be-done) questions.",
        },
        competitors: { type: "array", items: { type: "string" } },
        aliases: { type: "array", items: { type: "string" } },
        model: { type: "string" },
        samples: { type: "number" },
        mode: { type: "string", enum: ["quick", "standard", "detailed"] },
        persist: { type: "boolean" },
      },
      required: ["brand", "prompts"],
    },
  },
  {
    name: "get_history",
    description: "Return the trend of past Brand Visibility on Claude runs for a brand (newest first).",
    inputSchema: { type: "object", properties: { brand: { type: "string" } }, required: ["brand"] },
  },
  {
    name: "list_competitors",
    description: "Return the competitor leaderboard from the most recent run for a brand.",
    inputSchema: { type: "object", properties: { brand: { type: "string" } }, required: ["brand"] },
  },
  {
    name: "list_packs",
    description:
      "List the trademark-free category report packs (ecommerce, travel, hospitality, software, hardware, …), or pass a category id to get its prompt set.",
    inputSchema: { type: "object", properties: { category: { type: "string" } } },
  },
] as const;

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

const ok = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });
const err = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });
const textResult = (value: unknown) => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] });

async function callTool(name: string, args: Record<string, unknown>, deps: ToolDeps): Promise<unknown> {
  switch (name) {
    case "run_brand_report":
      return textResult(await runBrandReportTool(args as unknown as RunBrandReportArgs, deps));
    case "get_history":
      return textResult(getHistoryTool({ brand: String(args["brand"] ?? "") }, deps));
    case "list_competitors":
      return textResult(listCompetitorsTool({ brand: String(args["brand"] ?? "") }, deps));
    case "list_packs":
      return textResult(listPacksTool(args["category"] ? { category: String(args["category"]) } : {}));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/** Handle one JSON-RPC message. Returns the response object, or null for notifications. */
export async function dispatch(msg: JsonRpcRequest, deps: ToolDeps): Promise<object | null> {
  const { id, method, params } = msg;
  if (method === undefined) return null;

  switch (method) {
    case "initialize":
      return ok(id, {
        protocolVersion: (params?.["protocolVersion"] as string) ?? PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    case "notifications/initialized":
    case "initialized":
      return null; // notification, no reply
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const name = String(params?.["name"] ?? "");
      const args = (params?.["arguments"] as Record<string, unknown>) ?? {};
      try {
        return ok(id, await callTool(name, args, deps));
      } catch (e) {
        return ok(id, {
          content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }],
          isError: true,
        });
      }
    }
    default:
      if (id === undefined || id === null) return null; // unknown notification
      return err(id, -32601, `Method not found: ${method}`);
  }
}

export function startStdio(deps: ToolDeps = defaultToolDeps()): void {
  const rl = createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    void (async () => {
      let response: object | null = null;
      try {
        response = await dispatch(JSON.parse(trimmed) as JsonRpcRequest, deps);
      } catch {
        response = err(null, -32700, "Parse error");
      }
      if (response) process.stdout.write(JSON.stringify(response) + "\n");
    })();
  });
}
