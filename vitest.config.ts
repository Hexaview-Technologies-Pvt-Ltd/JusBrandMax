import { defineConfig } from "vitest/config";

// Default include globs are cwd-relative, so they work both at the workspace
// root (`pnpm test`) and inside a single package (`pnpm -r test`).
export default defineConfig({
  test: {
    passWithNoTests: true,
  },
});
