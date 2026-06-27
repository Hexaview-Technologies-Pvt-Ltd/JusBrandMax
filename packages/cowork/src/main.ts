#!/usr/bin/env node
import { startStdio } from "./server.js";

startStdio().catch((err: unknown) => {
  process.stderr.write((err instanceof Error ? err.message : String(err)) + "\n");
  process.exit(1);
});
