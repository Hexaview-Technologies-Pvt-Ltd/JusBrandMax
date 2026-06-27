/**
 * jusBrandMax Cowork MCP server — exposes the engine to Claude.ai / Claude Desktop.
 *
 * Tools: run_brand_report, get_history, list_competitors. Each is a thin wrapper
 * over the transport-free handlers in tools.ts, returning the result as JSON text.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  runBrandReportTool,
  getHistoryTool,
  listCompetitorsTool,
  defaultToolDeps,
  type ToolDeps,
} from "./tools.js";

const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

export function createServer(deps: ToolDeps = defaultToolDeps()): McpServer {
  const server = new McpServer({ name: "jusbrandmax", version: "0.1.0" });

  server.registerTool(
    "run_brand_report",
    {
      title: "Run Brand Visibility on Claude report",
      description:
        "Measure how visible a brand is on Claude across a set of category prompts: presence, share of voice vs competitors, prominence, sentiment, and factual accuracy. Requires ANTHROPIC_API_KEY in the server environment.",
      inputSchema: {
        brand: z.string().describe("The brand to measure."),
        prompts: z.array(z.string()).describe("Category questions a buyer would ask Claude."),
        competitors: z.array(z.string()).optional().describe("Competitor brand names."),
        aliases: z.array(z.string()).optional().describe("Alternate spellings/product names."),
        model: z.string().optional().describe("Claude model under test (default claude-opus-4-8)."),
        samples: z.number().int().positive().optional().describe("Samples per prompt (default 3)."),
        persist: z.boolean().optional().describe("Save to local history (default true)."),
      },
    },
    async (args) => json(await runBrandReportTool(args, deps)),
  );

  server.registerTool(
    "get_history",
    {
      title: "Get Brand Visibility history",
      description: "Return the trend of past Brand Visibility on Claude runs for a brand (newest first).",
      inputSchema: { brand: z.string() },
    },
    async (args) => json(getHistoryTool(args, deps)),
  );

  server.registerTool(
    "list_competitors",
    {
      title: "List competitor leaderboard",
      description: "Return the competitor leaderboard from the most recent run for a brand.",
      inputSchema: { brand: z.string() },
    },
    async (args) => json(listCompetitorsTool(args, deps)),
  );

  return server;
}

export async function startStdio(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}
