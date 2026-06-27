# Contributing to jusBrandMax

jusBrandMax is MIT-licensed and built in the open. Contributions of all kinds are welcome.

## Setup

```bash
pnpm install
pnpm -r build
pnpm -r test
```

Requires Node ≥ 20 and pnpm. The engine uses Node's built-in `node:sqlite`, so there
is no native build step.

## Layout

```
packages/engine   core: config, Claude provider, scorers, history, report
packages/cli      Claude Code plugin + `jusbrandmax` CLI
packages/cowork   MCP server + Agent Skill for Claude.ai / Claude Desktop
```

## Adding a scorer

The whole project's credibility rests on **open, auditable scoring**. When you add a
metric:

1. Write it as a **pure function** in `packages/engine/src/scorers.ts` (or a new file),
   taking `AskResult[]` + names and returning numbers.
2. Add an **inline comment stating the formula** — a reader should understand exactly
   how the number is computed without running it.
3. Add a **unit test** with a hand-checked fixture (`*.test.ts`).
4. If it belongs in the report, wire it into `computeReport` and the renderers.

LLM-as-judge scorers (sentiment, accuracy) follow the same rule: the *aggregation* is a
pure, tested function; only the judging call touches the provider, and it's tested with
an injected fake.

## Principles (don't regress these)

- **MIT, no telemetry, no phone-home.**
- **Bring-your-own-key** — never hardcode or transmit keys.
- **Local-first** — data stays on the user's machine.
- **White-label** — generated reports carry no branding unless the user opts in.

## Before opening a PR

```bash
pnpm -r build && pnpm -r test
```

Keep changes small and focused; match the surrounding style.
