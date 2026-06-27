# jusBrandMax

**The open-source brand command center for Claude — and other LLMs.**
Measure how visible your brand is on Claude (and any OpenAI-compatible engine), see exactly what the model tells people about you, and fix it — without leaving Claude.

![license](https://img.shields.io/badge/license-MIT-green) ![runtime deps](https://img.shields.io/badge/runtime%20deps-0-success) ![tests](https://img.shields.io/badge/tests-82%20passing-brightgreen) ![node](https://img.shields.io/badge/node-%E2%89%A520-blue) ![price](https://img.shields.io/badge/price-%240-blue) ![BYO key](https://img.shields.io/badge/bring--your--own--key-yes-orange)

> Built by **Kashi** ([linkedin](https://www.linkedin.com/in/kashiks/)) and
> **Rajan** ([linkedin](https://www.linkedin.com/in/thiyagarajan/)), founders of
> [Kalmantic](https://www.kalmantic.com). **MIT licensed.**

When buyers research your category, more and more of them ask **Claude** instead of Google. If Claude doesn't mention you — or worse, says something wrong about you — you lose the deal before you ever hear about it. jusBrandMax turns that invisible conversation into a **scored report you can act on**, runs entirely on your machine with your own API key, and lets Claude *fix* what it finds in the same session. Every paid tool in this space is closed SaaS at **$29–$5,000+/mo**; jusBrandMax is **$0, open source, and self-hostable.**

> ### 🔒 Built to pass Enterprise IT review
> **Zero runtime dependencies.** The shipped code imports **only the Node standard library** — `fetch` for the API, `node:sqlite` for history, `node:readline` for the MCP server. No Anthropic SDK, no MCP SDK, no zod, no transitive supply chain.
> - **Nothing to audit** — `dependencies: {}` in every package. `npm ls --prod` is empty.
> - **No data egress** beyond the one LLM endpoint *you* configure (bring-your-own-key; the key never leaves your machine).
> - **Self-hostable & air-gappable** — point it at an internal OpenAI-compatible model and it never calls out.
> - **Auditable by inspection** — every score is plain, commented TypeScript compiled to plain JS.

### Why this matters

Search told people *where to look*; LLMs tell people *what to choose*. Discovery has moved from ten blue links to one synthesized, ranked answer — and that answer is increasingly where the purchase is decided. As LLM shopping and a sponsored **ad layer** arrive, the brands that already measure their presence in answers will be the ones able to defend it. **[Read the thesis →](./THESIS.md)**

---

## Install

**As a Claude Code plugin** — from inside Claude Code, run these **one at a time** (one slash command per prompt):

1. `/plugin marketplace add https://github.com/KashiKS/jusBrandMax.git`
2. `/plugin install jusbrandmax@jusbrandmax`
3. `/reload-plugins`

You now have `/brand-init`, `/brand-report`, and `/brand-watch`.

**As a Cowork connector** (Claude.ai / Claude Desktop, for non-technical marketers) — add a custom MCP connector pointing at the jusBrandMax server, then chat with it:

```jsonc
// Claude Desktop → Settings → Connectors → Add custom connector
{
  "command": "npx",
  "args": ["-y", "@jusbrandmax/cowork"]   // or: node /path/to/jusBrandMax/packages/cowork/dist/main.js
}
```

The bundled [Agent Skill](./packages/cowork/skill/SKILL.md) teaches Claude how to drive it, so you can just ask *"How visible is my brand on Claude?"*

**From source (works today — Node ≥ 20 + pnpm):**

```bash
git clone https://github.com/KashiKS/jusBrandMax && cd jusBrandMax
pnpm install && pnpm -r build
export ANTHROPIC_API_KEY=sk-ant-...        # bring-your-own-key; never leaves your machine
node packages/cli/dist/main.js --help
```

---

## Seamless in Claude & Cowork

**In Claude Code (developers, agencies, CI):**

```bash
jusbrandmax init --brand "Acme CRM" --about "a CRM for startups"  # auto-generates prompts + competitors
jusbrandmax report --badge badge.svg   # full report + an embeddable visibility badge
jusbrandmax fix        # Claude drafts the #1 fix → publish it → re-run to prove the lift
jusbrandmax watch      # the trend vs your last run
jusbrandmax diff       # compare your last two runs (e.g. Claude vs another engine)
```

…or just say **`/brand-report`** in Claude Code and Claude runs it, reads the result, and offers to draft the fix.

**The loop that makes it land:** `report` finds the gap → **`fix`** has Claude draft the page/FAQ/correction → you publish → the next `report` + `watch` shows the **measured lift**. Measurement *and* the fix, with proof — in one place.

**In Cowork (marketers, in plain chat):**

> **You:** How visible is "Acme CRM" on Claude vs Globex and Initech?
> **Claude:** *(calls `run_brand_report`)* Acme CRM scores **56/100**. You're in **67% of direct "best CRM" answers — but 0% of the problem-led questions** buyers actually start with (like *"how do I stop losing leads?"*), where Globex and Initech win. Claude also claimed you have a built-in phone dialer, which your facts don't support. Want me to draft a lead-tracking guide and a correction?

### What a report looks like (real engine output, [`examples/brand-report.md`](./examples/brand-report.md))

```text
Brand Visibility on Claude — Acme CRM        Overall: 55.8/100

| Dimension                       | Score |
| Presence (visibility)           | 40%   |
| Share of Voice                  | 21%   |
| Prominence (first-mention rate) | 75%   |
| Sentiment (net)                 | 1.00  |
| Accuracy                        | 67% (0 contradicted, 1 unsupported) |

Intent:  direct ("best CRM") 67%  ·  indirect (problem-led) 0%   ← the early-funnel gap
Leaderboard:  1. Initech 42%  ·  2. Globex 37%  ·  3. Acme CRM 21%
```

Full version: [`examples/brand-report.md`](./examples/brand-report.md). In **detailed** mode the report also writes an **executive summary**, **per-dimension interpretation**, an ordered **Action Center**, and the **verbatim quotes** behind every score — all data-derived, no hand-waving.

Reports are **white-label by default** (no jusBrandMax branding) and saved to local SQLite history so `watch` can show deltas over time.

### Measure beyond Claude, run beyond Claude Code (P2)

- **Measure other engines** — set `"provider": "openai"` (+ optional `"baseURL"`) in `brand.config.json` to run the *same* report against any **OpenAI-compatible** endpoint: OpenAI, OpenRouter, Together, Groq, or a **local/internal model** (Ollama, llama.cpp). The report retitles to "Brand Visibility on OpenAI", etc. Claude stays the default and the hero. *(Still zero-dependency — it's `fetch` either way.)*
- **Run in other agents** — the Cowork server is a standard stdio MCP server, so **OpenCode, Codex CLI, Cursor, Cline, and Windsurf** can call the same tools today. Point their MCP config at `node /path/to/jusBrandMax/packages/cowork/dist/main.js`.

### Category report packs (trademark-free)

Ready-made, buyer-intent prompt sets for the verticals where LLM answers most directly steer spend. **No third-party trademarks are baked into any pack or report** — you supply your brand and competitors at runtime, and they stay on your machine.

```bash
jusbrandmax packs                       # list packs
jusbrandmax init --category ecommerce   # scaffold an e-commerce config
```

`ecommerce` · `software` · `hardware` · `travel` · `hospitality` · `finance` · `healthcare` · `professional-services`

**E-commerce is the first battleground** — buyers increasingly delegate the purchase decision to the model. See the [special report on why it matters →](./THESIS.md#special-report-e-commerce-brand-visibility).

**Direct *and* indirect intent.** Each pack measures two bands: **direct** ("best `<category>`?" — active shopping) and **indirect** — the problem / jobs-to-be-done questions that drive demand *before* the buyer names the category ("how do I solve `<problem>`?"). Showing up on direct prompts but vanishing on indirect ones is the early-funnel gap most brands never see — the report calls it out explicitly.

### Sample reports (representative, fictitious brands — generated by the engine)

By category: [ecommerce](./examples/reports/ecommerce.md) · [software](./examples/reports/software.md) · [hardware](./examples/reports/hardware.md) · [travel](./examples/reports/travel.md) · [hospitality](./examples/reports/hospitality.md) · [finance](./examples/reports/finance.md) · [healthcare](./examples/reports/healthcare.md) · [professional-services](./examples/reports/professional-services.md)

**Long, descriptive (detailed mode)** — executive summary + per-dimension interpretation + ordered Action Center + verbatim evidence quotes + per-prompt drill-down: [ecommerce](./examples/reports/ecommerce-detailed.md) · [software](./examples/reports/software-detailed.md) · [travel](./examples/reports/travel-detailed.md)

Also: [cross-engine diff](./examples/reports/cross-engine-diff.md) · embeddable [badge](./examples/badge.svg). Every line in these is real engine output — the plugin emits exactly this.

### Report modes — depth on demand

`--mode quick | standard | detailed` trades depth for speed and cost:

| Mode | Samples/prompt | Includes |
|---|---|---|
| `quick` | 1 | Headline score + dimensions |
| `standard` | your `samples` (default 3) | + intent breakdown, competitor leaderboard, gaps |
| `detailed` | ≥ 4 | + per-prompt visibility drill-down |

```bash
jusbrandmax report --mode detailed
```

See the difference: [quick](./examples/reports/ecommerce-quick.md) vs [detailed](./examples/reports/ecommerce-detailed.md).

---

## jusBrandMax vs. the closed-SaaS field

jusBrandMax is the only column you can read the source of, run for free, and host yourself.

| | **jusBrandMax** | Profound | Peec | AthenaHQ | Scrunch | Otterly |
|---|---|---|---|---|---|---|
| **License** | **MIT (open)** ★ | Closed | Closed | Closed | Closed | Closed |
| **Zero runtime dependencies** | **✓ (stdlib only)** ★ | n/a (SaaS) | n/a | n/a | n/a | n/a |
| **Enterprise-IT auditable / air-gappable** | **✓** ★ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Entry price** | **$0** ★ | ~$2k–5k+/mo, sales-gated | €89/mo | $95/mo | $250/mo | $29/mo |
| **Self-host / local-first** | **✓** ★ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Open / auditable scoring** | **✓ code** ★ | black box | black box | black box | black box | black box |
| **Runs inside Claude (CLI + Cowork)** | **✓** ★ | ✗ (dashboard) | ✗ | ✗ | ✗ | ✗ |
| **Acts on findings in-session** | **✓** ★ | ✗ | ✗ | partial | ✗ | ✗ |
| **White-label by default** | **✓** ★ | enterprise only | partial | partial | partial | ✗ |
| **Bring-your-own-key (no markup)** | **✓** ★ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **CI / pipeline mode + JSON API** | **✓** ★ | upper tiers | ✗ | ✗ | ✗ | ✗ |
| **Data residency** | **your machine** ★ | their cloud | their cloud | their cloud | their cloud | their cloud |

**Five durable edges:** ① open methodology (forkable scoring, not a black box) · ② agent-native (measure *and* fix in one Claude session) · ③ free + self-hostable (your prompt strategy never leaves your machine) · ④ white-label by default · ⑤ composable (a plugin *and* an MCP server, drops into CI and other agents).

> **Scope:** Claude-first by design — the hero deliverable is the **Brand Visibility on Claude** report, and Claude is the default. The engine is model-agnostic, so the same report runs against **any OpenAI-compatible engine** (OpenAI, OpenRouter, Together, Groq, or a local/internal model). One tool, Claude and the rest.

---

## The "Brand Visibility on Claude" report — 6 scored dimensions

**Presence** · **Share of Voice** · **Prominence** · **Sources** · **Sentiment & Positioning** · **Accuracy**

Each blends into a single 0–100 headline score, computed in [auditable code](./packages/engine/src/report.ts) you can read and tune.

---

## Feature matrix (61)

**Legend** — Surface: ✓ full · ◐ partial · — n/a.  Type: **★ distinct** (unique to us / best-in-class) · **⚔️ parity** (matches the strongest competitor, but free & open).
Everything below is **MIT-licensed and free**.

### A. Core Visibility Measurement — *the report*
*Edge: same core metrics as Profound/Peec/Athena, but the scoring is open code you can audit and tune.*

| # | Feature | What it does | CLI | Cowork | Type |
|---|---|---|---|---|---|
| 1 | Prompt Universe Builder | Generate & curate the category prompts, intents, and personas to test. | ✓ | ✓ | ⚔️ |
| 2 | AI Visibility Score | % of prompts where Claude mentions your brand. | ✓ | ✓ | ⚔️ |
| 3 | Share of Voice | Your mention rate vs. named competitors on the same prompts. | ✓ | ✓ | ⚔️ |
| 4 | Answer Prominence | First-mention rate, list position, depth-of-mention. | ✓ | ✓ | ⚔️ |
| 5 | Recommendation Rate | "Actively recommended" vs. merely "mentioned." | ✓ | ✓ | ★ |
| 6 | Topic Coverage Map | Sub-topics you appear in vs. are absent from. | ✓ | ✓ | ⚔️ |
| 7 | Sentiment & Positioning | How Claude characterizes you — tone, framing, strengths/weaknesses. | ✓ | ✓ | ⚔️ |
| 8 | Visibility Heatmap | Prompt × dimension grid for at-a-glance hotspots/cold spots. | ✓ | ◐ | ★ |

### B. Answer Quality & Accuracy
*Edge: most tools stop at "are you mentioned." We grade whether what Claude says is **true** — and prove it with repeated sampling.*

| # | Feature | What it does | CLI | Cowork | Type |
|---|---|---|---|---|---|
| 9 | Hallucination Detector | Flags false or unsupported claims Claude makes about you. | ✓ | ✓ | ⚔️ |
| 10 | Claim Verification | Checks Claude's statements against your Brand Knowledge Pack. | ✓ | ✓ | ★ |
| 11 | Staleness Detector | Surfaces outdated facts (old pricing, sunset products, ex-staff). | ✓ | ✓ | ★ |
| 12 | Misattribution Detector | Catches your features credited to rivals (and vice versa). | ✓ | ✓ | ★ |
| 13 | Refusal & Omission Tracker | Logs when Claude declines, hedges, or silently omits you. | ✓ | ◐ | ★ |
| 14 | Statistical Confidence | Repeated sampling → confidence intervals on every score. | ✓ | ◐ | ⚔️ |

### C. Competitive Intelligence
*Edge: parity with Athena's competitor tooling, plus a "what does Claude believe about each rival's pricing/features" probe nobody ships cheaply.*

| # | Feature | What it does | CLI | Cowork | Type |
|---|---|---|---|---|---|
| 15 | Competitor Leaderboard | Ranks every brand Claude surfaces in your category. | ✓ | ✓ | ⚔️ |
| 16 | Competitor Gap Analysis | Prompts where rivals win and you're absent → to-do list. | ✓ | ✓ | ⚔️ |
| 17 | Co-mention Graph | Which brands Claude pairs/recommends alongside yours. | ✓ | ◐ | ★ |
| 18 | Competitor Impersonation Probe | What Claude says when asked *as if* you were a rival. | ✓ | ◐ | ⚔️ |
| 19 | Strength/Weakness Matrix | Side-by-side of how Claude frames each brand's pros/cons. | ✓ | ✓ | ★ |
| 20 | Belief Audit | What Claude *believes* about each brand's pricing/features/claims. | ✓ | ✓ | ★ |
| 21 | New-Entrant Radar | Brands newly appearing in your space over time. | ◐ | — | ★ |

### D. Prompt & Demand Intelligence
*Edge: an open analog of Profound's Conversation Explorer — estimate which questions actually get asked, no enterprise contract.*

| # | Feature | What it does | CLI | Cowork | Type |
|---|---|---|---|---|---|
| 22 | Topic Volume Estimator | Estimates how often category topics are asked of Claude. | ✓ | ✓ | ⚔️ |
| 23 | Intent Classifier | Tags prompts informational / commercial / navigational. | ✓ | ✓ | ★ |
| 24 | Persona-Conditioned Prompts | Runs the set as different buyer personas. | ✓ | ✓ | ⚔️ |
| 25 | Buyer-Journey Mapping | Maps visibility across awareness → consideration → decision. | ✓ | ✓ | ★ |
| 26 | Related-Prompt Mining | Expands your set with adjacent questions Claude associates. | ✓ | ✓ | ★ |

### E. Source & Citation Intelligence
*Edge: not just "which sources are cited," but which sources **move** Claude's answer — and where you can earn a citation.*

| # | Feature | What it does | CLI | Cowork | Type |
|---|---|---|---|---|---|
| 27 | Citation Source Tracker | Domains/URLs Claude leans on for your category. | ✓ | ◐ | ⚔️ |
| 28 | Source Influence Ranking | Which sources most shift answers (ablation testing). | ✓ | ◐ | ★ |
| 29 | Own-Domain Citation Audit | Whether — and which of — your own pages get cited. | ✓ | ◐ | ⚔️ |
| 30 | Earned/Owned/Rival Split | Breaks citations into your pages, earned media, competitors. | ✓ | ◐ | ★ |
| 31 | Citation Opportunity Finder | Pages/domains worth targeting to earn a citation. | ✓ | ✓ | ⚔️ |

### F. AI Crawler & Traffic Analytics — *Claude-native*
*Edge: focused on Claude's own crawlers (ClaudeBot, Claude-User, Claude-SearchBot) from your server logs — no CDN-integration upsell like Profound's Agent Analytics.*

| # | Feature | What it does | CLI | Cowork | Type |
|---|---|---|---|---|---|
| 32 | Claude Crawler Log Analyzer | Parses server logs for Claude bot user-agents & behavior. | ✓ | — | ⚔️ |
| 33 | Crawl Coverage Gaps | Pages Claude's bots never fetch. | ✓ | — | ★ |
| 34 | robots.txt / Access Advisor | Confirms you're letting the right Claude bots in. | ✓ | ◐ | ★ |
| 35 | Claude Referral Tracker | Downstream traffic arriving from claude.ai. | ✓ | — | ⚔️ |
| 36 | Crawl→Citation Correlation | Links crawled pages to pages Claude actually cites. | ✓ | — | ★ |
| 37 | Crawl Freshness Monitor | Last-seen-by-ClaudeBot per page; flags stale crawls. | ✓ | — | ★ |

### G. Optimization & Action Layer
*Edge: Athena tells you what to do; jusBrandMax does it — Claude drafts the fix in the same session, then re-tests it.*

| # | Feature | What it does | CLI | Cowork | Type |
|---|---|---|---|---|---|
| 38 | Ordered Action Center | Ranked, vertical-specific fixes by impact/effort. | ✓ | ✓ | ⚔️ |
| 39 | Optimization Simulator | Test a page/message against Claude *before* publishing. | ✓ | ◐ | ★ |
| 40 | GEO Content Brief Generator | Answer-engine-optimized briefs for writers. | ✓ | ✓ | ⚔️ |
| 41 | In-Session Content Studio | Claude drafts optimized copy you can ship immediately. | ✓ | ✓ | ★ |
| 42 | FAQ / Q&A Generator | Extractable Q&A blocks that AI engines favor. | ✓ | ✓ | ⚔️ |
| 43 | Schema / Structured-Data Advisor | Recommends + generates schema markup. | ✓ | ◐ | ⚔️ |

### H. Brand Governance & Voice
*Edge: closes the loop — define the canonical brand truth, then continuously check Claude (and your own content) against it.*

| # | Feature | What it does | CLI | Cowork | Type |
|---|---|---|---|---|---|
| 44 | Brand Voice Checker | Scans content/answers against your voice guide; flags drift. | ✓ | ✓ | ⚔️ |
| 45 | Brand Knowledge Pack | Canonical brand facts (`llms.txt` + internal grounding file).¹ | ✓ | ✓ | ★ |
| 46 | Messaging Consistency Auditor | Detects contradictory claims across pages & answers. | ✓ | ✓ | ★ |
| 47 | Negative-Narrative Watch | Watches for emerging negative framing / crisis signals. | ◐ | ◐ | ⚔️ |
| 48 | Approved-Claims Library | Compliance-safe claim list to ground content & checks. | ✓ | ✓ | ★ |

### I. Reporting, History & Collaboration
*Edge: full history & scheduling are free here — they're the paywalled "moat" everywhere else.*

| # | Feature | What it does | CLI | Cowork | Type |
|---|---|---|---|---|---|
| 49 | White-Label Export | Markdown / PDF / HTML reports, fully rebrandable. | ✓ | ✓ | ★ |
| 50 | Visibility-over-Time | Local history store with trend lines & deltas. | ✓ | ◐ | ⚔️ |
| 51 | Scheduled Runs & Digests | Cron/hooks → recurring runs + Slack/email summaries. | ✓ | ◐ | ⚔️ |
| 52 | Alerting & Anomaly Detection | Pings on visibility drops, new hallucinations, SOV shifts. | ✓ | ◐ | ⚔️ |
| 53 | Multi-Brand / Client Workspaces | Multiple brands, profiles, and histories for agencies. | ✓ | ◐ | ⚔️ |

### J. Claude-Native & Developer Superpowers — *our moat*
*Edge: none of these exist in closed SaaS. This is why jusBrandMax is structurally different, not just cheaper.*

| # | Feature | What it does | CLI | Cowork | Type |
|---|---|---|---|---|---|
| 54 | Runs Inside Claude | Slash commands (CLI) + Skill/MCP (Cowork); act + measure in one place. | ✓ | ✓ | ★ |
| 55 | Bring-Your-Own-Key | Uses your Anthropic API key — real access, zero markup. | ✓ | ✓ | ★ |
| 56 | Open & Auditable Scoring | Every metric is inspectable, forkable code. | ✓ | ✓ | ★ |
| 57 | Self-Hostable / Local-First | Data and prompt strategy never leave your machine. | ✓ | ◐ | ★ |
| 58 | Model-Version Tracking | Compares visibility across Claude models & over upgrades. | ✓ | ◐ | ★ |
| 59 | Multi-Language Testing | Runs the prompt set in any language Claude speaks. | ✓ | ✓ | ⚔️ |
| 60 | CI / Pipeline Mode + JSON API | Regression-test brand visibility on every release. | ✓ | — | ★ |
| 61 | MCP Server | Exposes jusBrandMax tools to any MCP client / agent. | ✓ | ✓ | ★ |

> ¹ **Honest note on `llms.txt`:** current server-log studies show AI crawlers don't yet fetch `llms.txt` in practice. We generate it for future-proofing and, more importantly, use the same canonical facts internally to ground Claim Verification (#10) and the Content Studio (#41).

**Tally:** 61 features — **34 distinct (★)**, 27 at-or-above best-in-class parity (⚔️) — all MIT.

> **Shipping now (v0.1):** the core report + intent bands, evidence & confidence, executive summary + Action Center, 3 modes, onboarding, the measure→fix→prove loop, cross-engine diff, HTML + badge, and the Claude-native core are implemented and tested (82 tests), **with zero runtime dependencies** and an OpenAI-compatible provider for non-Claude engines. The rest of the matrix is the public roadmap below.

---

## Architecture (one engine, two frontends)

```
                 ┌────────────────────────────┐
                 │   jusBrandMax core engine   │  ← MIT, self-hostable
                 │  prompt runner · scorers ·  │
                 │  competitors · history ·    │
                 │  report generator           │
                 └─────────────┬──────────────┘
              ┌────────────────┴────────────────┐
   CLI plugin (Claude Code)            Cowork plugin (Claude.ai / Desktop)
   slash cmds · subagents · hooks      MCP connector + Agent Skill
        │
        └── also runs as a standalone MCP server + CI/JSON API
```

`packages/engine` (core) · `packages/cli` (Claude Code plugin + binary) · `packages/cowork` (MCP + Skill). Built with pnpm + TypeScript; history uses Node's built-in `node:sqlite` (no native build).

---

## Roadmap

- **v0.1 (now):** 6-dimension report + **direct/indirect intent**, competitor leaderboard + gaps, **evidence quotes + confidence**, **executive summary + Action Center**, **3 modes** (quick/standard/detailed), **10-second onboarding** (`init --brand`), the **measure→fix→prove loop** (`fix`), **cross-engine diff**, shareable **HTML + SVG badge**, local history + deltas, both plugins, **zero-dependency** MCP server, CI mode, **OpenAI-compatible** multi-engine, 8 category packs. 82 tests.
- **Next:** GitHub Action CI gate, scheduled runs + alerts (#51–52), first-class docs/config for **OpenCode / Codex / Cursor**, Claude crawler log analyzer (#32–37), citation intelligence (#27–31).
- **Later:** optimization simulator (#39), "fix-it PR" generator (open the PR, not just draft it), multi-brand workspaces, ChatGPT/Gemini consumer-surface drivers, PDF export.

Everything stays **zero-runtime-dependency** — new engines are added as `fetch`-based providers, never SDKs.

PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) (every new scorer ships as pure, commented, unit-tested code). Building it or curious about status? See [BUILD_GOAL.md](./BUILD_GOAL.md).

---

## License

**MIT** — see [LICENSE](./LICENSE). Everything in jusBrandMax, including both plugins and the core engine, is and will remain MIT-licensed.

---

## Sources

GEO landscape, metrics & competitor feature sets:
- [Best AI Visibility Tools 2026 — Surmado](https://www.surmado.com/blog/best-ai-visibility-tools-2026)
- [Profound vs Peec vs Otterly — Discovered Labs](https://discoveredlabs.com/blog/profound-vs-peec-vs-otterly-which-ai-visibility-platform-should-you-buy)
- [Profound AI Review 2026: Limits & Pricing — Analyze AI](https://www.tryanalyze.ai/blog/profound-ai-review)
- [Profound AI Review for Agencies — Rankability](https://www.rankability.com/blog/profound-ai-review/)
- [AthenaHQ alternatives & feature breakdown — LLM Pulse](https://llmpulse.ai/blog/best-athenahq-alternatives/)
- [Evertune vs Peec — Evertune](https://www.evertune.ai/resources/insights-on-ai/evertune-vs-peec-which-geo-platform-delivers-the-best-results)
- [What is GEO — Search Engine Land](https://searchengineland.com/what-is-generative-engine-optimization-geo-444418)
- [How to Measure AI Share of Voice — Semrush](https://www.semrush.com/blog/how-to-measure-ai-share-of-voice/)
- [7 GEO Metrics That Show Impact — Walker Sands](https://www.walkersands.com/about/blog/generative-engine-optimization-metrics/)
- [Top GEO Tools 2026 — NoGood](https://nogood.io/blog/generative-engine-optimization-tools/)

Claude crawlers & AI traffic:
- [AI Bot Behavior: 48 Days of Server Logs — Wislr](https://www.wislr.com/articles/ai-bot-behavior-log-analysis)
- [AI Crawler Management: GPTBot, ClaudeBot, PerplexityBot — Alice Labs](https://alicelabs.ai/en/insights/ai-crawler-management)
- [The AI User-Agent Landscape 2026 — No Hacks](https://nohacks.co/blog/ai-user-agents-landscape-2026)

Claude extension surfaces:
- [Extend Claude Code — Claude Code Docs](https://code.claude.com/docs/en/features-overview)
- [Claude Code Plugins Complete Guide — hidekazu-konishi](https://hidekazu-konishi.com/entry/claude_code_plugins_complete_guide.html)
- [Model Context Protocol — Anthropic](https://www.anthropic.com/news/model-context-protocol)
- [Claude Connectors & MCP guide — explainx.ai](https://explainx.ai/blog/how-to-use-claude-connectors-mcp-servers-complete-guide-2026)

Brand management:
- [Brand Voice Strategy — Sprinklr](https://www.sprinklr.com/blog/brand-voice/)
- [Brand governance — Bynder](https://www.bynder.com/en/blog/what-is-brand-governance/)
