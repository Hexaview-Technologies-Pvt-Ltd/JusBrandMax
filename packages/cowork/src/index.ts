/**
 * jusBrandMax Cowork — programmatic surface.
 *
 * The runnable MCP server is `main.ts` (stdio). This entry re-exports the server
 * factory and tool handlers for embedding/testing.
 */
export { VERSION } from "@jusbrandmax/engine";
export { createServer, startStdio } from "./server.js";
export * from "./tools.js";
