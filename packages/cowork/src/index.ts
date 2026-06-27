/**
 * jusBrandMax Cowork — programmatic surface.
 *
 * The runnable MCP server is `main.ts` (stdio). This entry re-exports the
 * JSON-RPC dispatcher, tool registry, and tool handlers for embedding/testing.
 */
export { VERSION } from "@jusbrandmax/engine";
export { dispatch, startStdio, TOOLS } from "./server.js";
export * from "./tools.js";
