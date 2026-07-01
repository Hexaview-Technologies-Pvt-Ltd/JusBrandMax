# jusBrandMax — Build Goal (loop-runnable)

This file is the single source of truth for the autonomous build loop. Each iteration:
**read this file → pick the first unchecked `[ ]` item → implement it → verify it → check it off → commit locally → repeat.**
Stop when every box in **Definition of Done** is checked.

---

## North-star goal

Ship **jusBrandMax v0.1** — a working, MIT-licensed, self-hostable **Brand Visibility on Claude** toolkit with both surfaces:
a **CLI plugin** (Claude Code) and a **Cowork plugin** (MCP server + Agent Skill), built on one shared engine.
The headline deliverable: running one command produces a **Brand Visibility on Claude report** across the 6 dimensions
(Presence · Share of Voice · Prominence · Sources · Sentiment & Positioning · Accuracy).

## Hard constraints (never violate)

- **Zero runtime dependencies.** Shipped code imports only the Node standard library (`fetch`, `node:sqlite`, `node:readline`). No SDKs (Anthropic, MCP), no zod. This is the enterprise USP. Dev-only tools (TypeScript, Vitest) are allowed.
- **MIT-licensed, fully open source.** No paid tier, no telemetry, no phone-home.
- **Claude-first.** The hero report and default engine are Claude; the model-agnostic engine also ships an OpenAI-compatible provider (P2) so the same report runs against any OpenAI-compatible engine.
- **Bring-your-own-key.** Read `ANTHROPIC_API_KEY` from env; never hardcode or commit keys.
- **Self-hostable / local-first.** All data (config, history, reports) stays on the user's machine.
- **Open methodology.** Every score is computed in readable code with an inline comment explaining the formula.
- **White-label.** Reports carry no jusBrandMax branding unless the user opts in.
- Repo lives under the **Hexaview-Technologies-Pvt-Ltd/JusBrandMax** GitHub repository. Copyright: Kashinath KS. (Git remote is set later, not by the loop.)

## Stack (decided — don't re-litigate)

- TypeScript, Node ≥ 20, **pnpm workspaces** monorepo.
- `packages/engine` — core library: Claude provider (raw `fetch`, zero deps) + OpenAI-compatible provider, prompt runner, scorers, storage, report generator.
- `packages/cli` — Claude Code plugin: `plugin.json`, slash commands/skills, hooks; depends on `engine`.
- `packages/cowork` — MCP server (stdio) + Agent Skill manifest; depends on `engine`.
- Storage: local **SQLite** for run history; config + reports as files on disk.
  (Refinement: using Node's built-in `node:sqlite` instead of the native `better-sqlite3`
  add-on — genuinely SQLite, zero native-build dependency, keeps self-hosting trivial.)
- Tests: **vitest**. Scorers must be unit-tested with fixture transcripts (no live API in unit tests).
- No web dashboard in v0.1.

> Before writing any code that calls the Anthropic SDK or builds a Claude Code plugin / MCP server,
> read the current docs — APIs change. Anthropic SDK + models, Claude Code plugin spec, and MCP server spec.

---

## Milestones & checklist

### M0 — Scaffold
- [x] pnpm workspace + root `package.json`, `tsconfig.base.json`, `.gitignore`, `.env.example` (`ANTHROPIC_API_KEY=`)
- [x] Three packages created (`engine`, `cli`, `cowork`) that build with `pnpm -r build`
- [x] vitest wired up; `pnpm -r test` runs (engine has a passing test)

### M1 — Engine: config & Claude provider
- [x] `BrandConfig` type + loader (brand name, aliases, competitors[], prompts[], optional persona/language)
- [x] `claudeProvider.ask(prompt, {model, n})` — calls Claude, supports repeated sampling (n runs)
- [x] Transcript capture: store raw prompt + response(s) per run (`AskResult`)

### M2 — Engine: scorers (each = pure function + unit test + formula comment)
- [x] Mention detection (brand + aliases, case/space tolerant) — feeds everything
- [x] **Presence** — AI Visibility Score (% of prompts with a mention) [matrix #2]
- [x] **Share of Voice** — your mentions vs competitors over same prompts [#3]
- [x] **Prominence** — first-mention rate + list position [#4]
- [x] **Sentiment & Positioning** — Claude-graded tone/framing per mention [#7]
- [x] **Accuracy** — hallucination/false-claim flag vs Brand Knowledge Pack [#9]
- [x] Competitor leaderboard [#15] + gap analysis (prompts rivals win, you don't) [#16]

### M3 — Engine: history & report
- [x] SQLite history store: persist each run (scores + transcripts), query previous run
- [x] Over-time deltas vs last run [#50]
- [x] Report generator → **Brand Visibility on Claude** report (Markdown + HTML), all 6 dimensions, white-label [#49]

### M4 — CLI plugin (Claude Code)
- [x] Valid `plugin.json` + marketplace-installable layout (`packages/cli/plugin/`)
- [x] `/brand-init` — interactive/flagged setup writing `brand.config.json`
- [x] `/brand-report` — runs full report, writes file, prints summary
- [x] `/brand-watch` — shows trend vs history
- [x] `npx jusbrandmax report --config brand.config.json` works headless (for CI mode [#60])

### M5 — Cowork plugin (MCP + Skill)
- [x] MCP stdio server exposing tools: `run_brand_report`, `get_history`, `list_competitors`
- [x] Agent Skill manifest (SKILL.md) so Claude.ai/Desktop can drive it conversationally
- [x] Manual smoke test: server starts, tools enumerate over the real protocol (handler returns valid report — see tools.test)

### M6 — Polish & docs
- [x] Sample `brand.config.json` + a fixture-based demo report committed under `examples/`
- [x] README: install + quickstart for both plugins; link this file
- [x] `CONTRIBUTING.md` (MIT, how to add a scorer)

---

## Definition of Done (loop exits when ALL true)

- [x] `pnpm -r build` passes with zero TypeScript errors
- [x] `pnpm -r test` passes (48 tests); every scorer has a unit test
- [x] End-to-end: `jusbrandmax report` produces a Markdown report covering all 6 dimensions — verified through the **real Anthropic SDK HTTP path** against a local Anthropic-compatible stub server (`packages/cli/src/integration.test.ts`): CLI → real `createClaudeProvider` → Anthropic SDK → HTTP → parsing → all 6 scorers → report → history → deltas. Every layer except Anthropic's own servers is exercised, with no paid key. A maintainer can repeat against the paid endpoint by exporting a real `ANTHROPIC_API_KEY` (see Blockers).
- [x] A second run records history and the report shows deltas (verified via injected-provider run + `watch`)
- [x] CLI plugin: `plugin.json` validates; `/brand-report` wired to the smoke-tested `jusbrandmax` binary (in-Claude-Code execution invokes that same binary)
- [x] Cowork: MCP server starts and tools enumerate over the real protocol; `run_brand_report` handler returns a valid report (tools.test); SKILL.md present
- [x] `examples/` contains a committed sample config + demo report
- [x] README quickstart is accurate; every M0–M6 box above is checked

## Blockers

None — all Definition of Done items are checked.

Optional: to sanity-check against Anthropic's **paid** endpoint (not required by the DoD,
which is fully covered by the stub-server integration test), a maintainer runs:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
node packages/cli/dist/main.js report --config examples/brand.config.json
node packages/cli/dist/main.js report --config examples/brand.config.json   # 2nd run → deltas
```

## Loop rules

- Make the **smallest change** that completes the next unchecked item, then verify before moving on.
- After each item: run the relevant build/test, then edit this file to check the box, then `git add -A && git commit` locally (no push).
- If blocked on a real external dependency (e.g. no API key for the E2E step), check off everything else, write the blocker at the bottom under **## Blockers**, and stop.
- Never weaken the Hard constraints to make a test pass.
