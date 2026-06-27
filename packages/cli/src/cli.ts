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
  createProviderFor,
  keyEnvFor,
  getPack,
  listPacks,
  generatePromptUniverse,
  draftFix,
  renderBadge,
  renderDiffMarkdown,
  type ClaudeProvider,
  type BrandReport,
  type ReportDeltas,
  type ReportMode,
  type ProviderName,
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
  indirectPrompts: [
    "how do I solve <problem the category addresses>?",
    "what's the best way to <job to be done>?",
  ],
  mode: "standard",
  model: "claude-opus-4-8",
  samples: 3,
};

const HELP = `jusBrandMax — Brand Visibility on Claude (MIT, open source)

Usage:
  jusbrandmax init    [--config ...] [--category <id>] [--brand "Name"] [--about "one line"]
  jusbrandmax packs   list the category report packs (ecommerce, travel, …)
  jusbrandmax report  [--config ...] [--out brand-report.md] [--badge badge.svg]
                      [--mode quick|standard|detailed] [--format md|html] [--db <path>] [--footer]
  jusbrandmax watch   [--config ...] [--db <path>]
  jusbrandmax fix     [--config ...] [--brand "Name"] [--out brand-fix.md]   draft the top fix
  jusbrandmax diff    [--config ...] [--brand "Name"] [--out diff.md]        compare last two runs
  jusbrandmax help

Onboarding: 'init --brand "Acme CRM" --about "a CRM for startups"' auto-generates
prompts + competitors (needs ANTHROPIC_API_KEY).

Environment:
  ANTHROPIC_API_KEY   required for 'report' (bring-your-own-key)
`;

function fmtPp(x: number): string {
  const v = x * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(0)}pp`;
}

function printSummary(out: (s: string) => void, r: BrandReport, deltas: ReportDeltas | null): void {
  const d = r.dimensions;
  out(`\nBrand Visibility on ${r.engine} — ${r.brand}`);
  out(`Overall: ${r.overall}/100  (model ${r.model}, ${r.promptCount} prompts, ${r.sampleCount} samples)`);
  out(`  Presence       ${(d.presence.visibility * 100).toFixed(0)}%`);
  out(`  Share of Voice ${(d.shareOfVoice.brandShare * 100).toFixed(0)}%`);
  out(`  Prominence     ${(d.prominence.firstMentionRate * 100).toFixed(0)}%`);
  out(`  Sentiment      ${d.sentiment.net.toFixed(2)}`);
  out(`  Accuracy       ${(d.accuracy.accuracy * 100).toFixed(0)}%`);
  if (r.intentBreakdown.indirect.promptCount > 0) {
    out(
      `  Intent         direct ${(r.intentBreakdown.direct.visibility * 100).toFixed(0)}% · ` +
        `indirect ${(r.intentBreakdown.indirect.visibility * 100).toFixed(0)}%`,
    );
  }
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
      const category = flagStr(flags, "category");
      const brandFlag = flagStr(flags, "brand");
      const about = flagStr(flags, "about");
      let config: typeof SAMPLE_CONFIG = SAMPLE_CONFIG;
      let note = "Edit it, then run: jusbrandmax report";

      if (category) {
        const pack = getPack(category);
        if (!pack) {
          deps.stderr(`Unknown category '${category}'. Run 'jusbrandmax packs' to list them.`);
          return 1;
        }
        config = {
          ...SAMPLE_CONFIG,
          ...(brandFlag ? { brand: brandFlag } : {}),
          prompts: pack.prompts,
          indirectPrompts: pack.indirectPrompts,
        };
        note = "Replace the <...> placeholders and set your brand + competitors, then run: jusbrandmax report";
      } else if (brandFlag) {
        // 10-second onboarding: auto-generate the prompt universe + competitors.
        const canAuto = !!partial.makeProvider || !!deps.env["ANTHROPIC_API_KEY"];
        if (canAuto) {
          const provider =
            partial.makeProvider?.() ?? createProviderFor({ provider: "anthropic" }, deps.env);
          try {
            const s = await generatePromptUniverse(provider, {
              brand: brandFlag,
              model: SAMPLE_CONFIG.model,
              ...(about ? { description: about } : {}),
            });
            config = {
              ...SAMPLE_CONFIG,
              brand: brandFlag,
              competitors: s.competitors.length ? s.competitors : SAMPLE_CONFIG.competitors,
              prompts: s.prompts.length ? s.prompts : SAMPLE_CONFIG.prompts,
              indirectPrompts: s.indirectPrompts,
            };
            note = "Auto-generated prompts and competitors. Review them, then run: jusbrandmax report";
          } catch (e) {
            deps.stderr(`Auto-setup failed (${e instanceof Error ? e.message : e}); wrote a starter config.`);
            config = { ...SAMPLE_CONFIG, brand: brandFlag };
          }
        } else {
          deps.stderr("Tip: set ANTHROPIC_API_KEY to auto-generate prompts & competitors.");
          config = { ...SAMPLE_CONFIG, brand: brandFlag };
        }
      }

      writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
      deps.stdout(`Wrote config to ${configPath}.`);
      deps.stdout(note);
      return 0;
    }

    case "packs": {
      deps.stdout("Category report packs — trademark-free buyer-intent prompts.");
      deps.stdout("Use:  jusbrandmax init --category <id>\n");
      for (const p of listPacks()) {
        deps.stdout(`  ${p.id.padEnd(22)} ${p.label}`);
      }
      return 0;
    }

    case "report": {
      if (!existsSync(configPath)) {
        deps.stderr(`No config at ${configPath}. Run 'jusbrandmax init' first.`);
        return 1;
      }
      const config = loadBrandConfig(configPath);
      const modeFlag = flagStr(flags, "mode");
      if (modeFlag) {
        if (modeFlag !== "quick" && modeFlag !== "standard" && modeFlag !== "detailed") {
          deps.stderr(`Unknown --mode '${modeFlag}'. Use quick | standard | detailed.`);
          return 1;
        }
        config.mode = modeFlag as ReportMode;
      }
      const keyEnv = keyEnvFor(config.provider);
      const usingReal = !partial.makeProvider;
      if (usingReal && !deps.env[keyEnv]) {
        deps.stderr(`${keyEnv} is not set (bring-your-own-key). Set it and retry.`);
        return 1;
      }
      const makeProvider = partial.makeProvider ?? (() => createProviderFor(config, deps.env));
      const provider = makeProvider(deps.env[keyEnv]);

      const report = await runReport(provider, config, deps.now ? { now: deps.now() } : {});

      const store = openHistory(dbPath);
      const prev = store.latest(config.brand);
      store.save(report);
      store.close();
      const deltas = computeDeltas(report, prev);

      const format = flagStr(flags, "format") ?? "md";
      const footer = flags["footer"] === true;
      const out =
        format === "html"
          ? renderHtml(report, { footer })
          : renderMarkdown(report, { footer, mode: config.mode });
      const outPath = join(deps.cwd, flagStr(flags, "out") ?? (format === "html" ? "brand-report.html" : "brand-report.md"));
      writeFileSync(outPath, out);

      const badgePath = flagStr(flags, "badge");
      if (badgePath) writeFileSync(join(deps.cwd, badgePath), renderBadge(report) + "\n");

      printSummary(deps.stdout, report, deltas);
      deps.stdout(`\nReport written to ${outPath}${badgePath ? ` · badge → ${badgePath}` : ""}`);
      return 0;
    }

    case "fix": {
      const store = openHistory(dbPath);
      let brand = flagStr(flags, "brand");
      let model = "claude-opus-4-8";
      let provider: ProviderName = "anthropic";
      let baseURL: string | undefined;
      if (existsSync(configPath)) {
        const c = loadBrandConfig(configPath);
        brand = brand ?? c.brand;
        model = c.model;
        provider = c.provider;
        baseURL = c.baseURL;
      }
      if (!brand) {
        deps.stderr("Provide --brand or a config so I know which brand to fix.");
        store.close();
        return 1;
      }
      const latest = store.latest(brand);
      store.close();
      if (!latest) {
        deps.stderr(`No report yet for ${brand}. Run 'jusbrandmax report' first.`);
        return 1;
      }
      const top = latest.recommendations[0];
      if (!top) {
        deps.stdout("No recommended actions — nothing to fix. Nice work.");
        return 0;
      }
      const keyEnv = keyEnvFor(provider);
      if (!partial.makeProvider && !deps.env[keyEnv]) {
        deps.stderr(`${keyEnv} is not set (bring-your-own-key). Set it and retry.`);
        return 1;
      }
      const prov =
        partial.makeProvider?.() ?? createProviderFor({ provider, ...(baseURL ? { baseURL } : {}) }, deps.env);
      const md = await draftFix(prov, { brand, model, finding: `${top.title} — ${top.rationale}` });
      const outPath = join(deps.cwd, flagStr(flags, "out") ?? "brand-fix.md");
      writeFileSync(outPath, md + "\n");
      deps.stdout(`Drafted a fix for: ${top.title}`);
      deps.stdout(`Written to ${outPath}. Publish it, then re-run 'jusbrandmax report' + 'watch' to see the lift.`);
      return 0;
    }

    case "diff": {
      const store = openHistory(dbPath);
      let brand = flagStr(flags, "brand");
      if (!brand && existsSync(configPath)) brand = loadBrandConfig(configPath).brand;
      if (!brand) {
        deps.stderr("Provide --brand or a config so I know which brand to diff.");
        store.close();
        return 1;
      }
      const latest = store.latest(brand);
      const previous = store.previous(brand);
      store.close();
      if (!latest || !previous) {
        deps.stdout(`Need at least two runs for ${brand} to diff — run 'report' twice (e.g. two engines).`);
        return 0;
      }
      const out = renderDiffMarkdown(previous, latest);
      const outPath = flagStr(flags, "out");
      if (outPath) {
        writeFileSync(join(deps.cwd, outPath), out + "\n");
        deps.stdout(`Diff written to ${outPath}`);
      } else {
        deps.stdout(out);
      }
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
