/**
 * jusBrandMax CLI — headless entry to the engine (also CI mode, feature #60).
 *
 * `parseArgs` and `runCli` are side-effect-free (deps injected) so they unit-test
 * without touching the network or process globals. The `main.ts` wrapper wires
 * real stdout/fs/provider and process.exit.
 */
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  loadBrandConfig,
  runReport,
  renderMarkdown,
  renderHtml,
  openHistory,
  computeDeltas,
  createClaudeProvider,
  type ClaudeProvider,
  type BrandReport,
  type ReportDeltas,
} from "@jusbrandmax/engine";

export interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [command = "help", ...rest] = argv;
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (a && a.startsWith("--")) {
      const key = a.slice(2);
      const next = rest[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    }
  }
  return { command, flags };
}

export interface CliDeps {
  cwd: string;
  stdout: (s: string) => void;
  stderr: (s: string) => void;
  /** Injected in tests to avoid the network; defaults to the real Claude provider. */
  makeProvider?: (apiKey?: string) => ClaudeProvider;
  now?: () => string;
  env: Record<string, string | undefined>;
}

function flagStr(flags: Record<string, string | boolean>, key: string): string | undefined {
  const v = flags[key];
  return typeof v === "string" ? v : undefined;
}

const SAMPLE_CONFIG = {
  brand: "YourBrand",
  aliases: [] as string[],
  competitors: ["CompetitorA", "CompetitorB"],
  prompts: [
    "what is the best <category> tool?",
    "recommend a <category> solution for a small team",
    "compare the top <category> products",
  ],
  model: "claude-opus-4-8",
  samples: 3,
};

const HELP = `jusBrandMax — Brand Visibility on Claude (MIT, open source)

Usage:
  jusbrandmax init    [--config brand.config.json]
  jusbrandmax report  [--config brand.config.json] [--out brand-report.md]
                      [--format md|html] [--db <path>] [--footer]
  jusbrandmax watch   [--config brand.config.json] [--db <path>]
  jusbrandmax help

Environment:
  ANTHROPIC_API_KEY   required for 'report' (bring-your-own-key)
`;

function fmtPp(x: number): string {
  const v = x * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(0)}pp`;
}

function printSummary(out: (s: string) => void, r: BrandReport, deltas: ReportDeltas | null): void {
  const d = r.dimensions;
  out(`\nBrand Visibility on Claude — ${r.brand}`);
  out(`Overall: ${r.overall}/100  (model ${r.model}, ${r.promptCount} prompts, ${r.sampleCount} samples)`);
  out(`  Presence       ${(d.presence.visibility * 100).toFixed(0)}%`);
  out(`  Share of Voice ${(d.shareOfVoice.brandShare * 100).toFixed(0)}%`);
  out(`  Prominence     ${(d.prominence.firstMentionRate * 100).toFixed(0)}%`);
  out(`  Sentiment      ${d.sentiment.net.toFixed(2)}`);
  out(`  Accuracy       ${(d.accuracy.accuracy * 100).toFixed(0)}%`);
  if (deltas) {
    out(`\nSince last run: overall ${deltas.overall >= 0 ? "+" : ""}${deltas.overall.toFixed(1)}, ` +
      `presence ${fmtPp(deltas.visibility)}, SoV ${fmtPp(deltas.shareOfVoice)}`);
  } else {
    out(`\nFirst run for this brand — no history to compare yet.`);
  }
}

export async function runCli(argv: string[], partial: Partial<CliDeps> = {}): Promise<number> {
  const deps: CliDeps = {
    cwd: partial.cwd ?? process.cwd(),
    stdout: partial.stdout ?? ((s) => process.stdout.write(s + "\n")),
    stderr: partial.stderr ?? ((s) => process.stderr.write(s + "\n")),
    env: partial.env ?? process.env,
    ...(partial.makeProvider ? { makeProvider: partial.makeProvider } : {}),
    ...(partial.now ? { now: partial.now } : {}),
  };
  const { command, flags } = parseArgs(argv);
  const configPath = join(deps.cwd, flagStr(flags, "config") ?? "brand.config.json");
  const dbPath = join(deps.cwd, flagStr(flags, "db") ?? "jusbrandmax-history.sqlite");

  switch (command) {
    case "init": {
      if (existsSync(configPath)) {
        deps.stderr(`Refusing to overwrite existing ${configPath}`);
        return 1;
      }
      writeFileSync(configPath, JSON.stringify(SAMPLE_CONFIG, null, 2) + "\n");
      deps.stdout(`Wrote sample config to ${configPath}. Edit it, then run: jusbrandmax report`);
      return 0;
    }

    case "report": {
      if (!existsSync(configPath)) {
        deps.stderr(`No config at ${configPath}. Run 'jusbrandmax init' first.`);
        return 1;
      }
      const usingReal = !partial.makeProvider;
      if (usingReal && !deps.env["ANTHROPIC_API_KEY"]) {
        deps.stderr("ANTHROPIC_API_KEY is not set (bring-your-own-key). Set it and retry.");
        return 1;
      }
      const config = loadBrandConfig(configPath);
      const makeProvider =
        partial.makeProvider ?? ((k?: string) => createClaudeProvider({ ...(k ? { apiKey: k } : {}) }));
      const provider = makeProvider(deps.env["ANTHROPIC_API_KEY"]);

      const report = await runReport(provider, config, deps.now ? { now: deps.now() } : {});

      const store = openHistory(dbPath);
      const prev = store.latest(config.brand);
      store.save(report);
      store.close();
      const deltas = computeDeltas(report, prev);

      const format = flagStr(flags, "format") ?? "md";
      const footer = flags["footer"] === true;
      const out = format === "html" ? renderHtml(report, { footer }) : renderMarkdown(report, { footer });
      const outPath = join(deps.cwd, flagStr(flags, "out") ?? (format === "html" ? "brand-report.html" : "brand-report.md"));
      writeFileSync(outPath, out);

      printSummary(deps.stdout, report, deltas);
      deps.stdout(`\nReport written to ${outPath}`);
      return 0;
    }

    case "watch": {
      const store = openHistory(dbPath);
      let brand = flagStr(flags, "brand");
      if (!brand && existsSync(configPath)) brand = loadBrandConfig(configPath).brand;
      if (!brand) {
        deps.stderr("Provide --brand or a config so I know which brand to watch.");
        store.close();
        return 1;
      }
      const latest = store.latest(brand);
      const previous = store.previous(brand);
      store.close();
      if (!latest) {
        deps.stdout(`No history yet for ${brand}. Run 'jusbrandmax report' first.`);
        return 0;
      }
      printSummary(deps.stdout, latest, computeDeltas(latest, previous));
      return 0;
    }

    case "help":
    default: {
      deps.stdout(HELP);
      return command === "help" || command === "--help" ? 0 : 1;
    }
  }
}
