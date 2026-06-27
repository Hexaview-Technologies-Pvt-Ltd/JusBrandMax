/**
 * jusBrandMax CLI package — programmatic surface.
 *
 * The runnable binary lives in `main.ts` (wired via the `bin` field). This entry
 * re-exports the engine version and the CLI runner for embedding/testing.
 */
export { VERSION } from "@jusbrandmax/engine";
export { runCli, parseArgs, type CliDeps } from "./cli.js";
