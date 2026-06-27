# jusBrandMax

**The open-source brand command center for Claude.**
Measure how visible your brand is on Claude, find out what Claude says about you, and fix it — all without leaving Claude.

> **100% MIT-licensed. No paid tier, no seats, no sales call, no black box.**
> Every competitor in this space is closed SaaS ($29–$5,000+/mo). jusBrandMax is free, self-hostable, and its scoring is auditable code.

### The competitive story, up front

Every rival is closed SaaS — **$29–$5,000+/mo, black-box, and lives outside your workflow.** jusBrandMax's [10 structural advantages](#why-jusbrandmax-wins-the-wedge) all flow from inverting that one fact. Our **five durable edges**:

1. **Open methodology** — scoring is auditable, forkable code, not a black box.
2. **Agent-native** — act *and* measure in a single Claude session.
3. **Free / self-hostable** — no procurement, no per-seat tax, your data stays on your machine.
4. **White-label by default** — agencies rebrand freely.
5. **Composable** — a plugin *and* an MCP server, so it drops into CI and other agents.

jusBrandMax ships as **two plugins over one shared engine**, both targeting Claude:

| Surface | What it is | Who it's for |
|---|---|---|
| **CLI plugin** | A Claude Code plugin — slash commands (`/brand-report`, `/brand-watch`), subagents, hooks, bundled MCP. Agentic / terminal workload. | Developers, agencies, growth engineers, CI |
| **Cowork plugin** | An **MCP connector + Agent Skill** for Claude.ai / Claude Desktop. Add it to a Project and chat: *"How visible is my brand on Claude?"* | Brand & marketing teams (non-technical) |

**Scope:** Claude-only by design — the hero deliverable is the **Brand Visibility on Claude** report. The engine is built model-agnostic so other engines *can* be added, but Claude is the whole point of v1.

---

## Why jusBrandMax wins (the wedge)

Today's AI-visibility tools are powerful but closed, expensive, and live *outside* your workflow. jusBrandMax inverts all three.

| Axis | Profound | Peec | AthenaHQ | Scrunch | Otterly | **jusBrandMax** |
|---|---|---|---|---|---|---|
| **License** | Closed | Closed | Closed | Closed | Closed | **MIT (OSS)** ★ |
| **Entry price** | ~$2k–5k+/mo, sales-gated | €89/mo | $95/mo | $250/mo | $29/mo | **$0** ★ |
| **Self-host / local-first** | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** ★ |
| **Open / auditable scoring** | Black box | Black box | Black box | Black box | Black box | **✓ code** ★ |
| **Runs inside Claude (agent-native)** | ✗ (dashboard) | ✗ | ✗ | ✗ | ✗ | **✓ CLI + Cowork** ★ |
| **Acts on findings in-session** | ✗ | ✗ | partial | ✗ | ✗ | **✓** ★ |
| **White-label** | Enterprise only | partial | partial | partial | ✗ | **✓ default** ★ |
| **Bring-your-own-key (no markup)** | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** ★ |
| **CI / pipeline mode + JSON API** | upper tiers | ✗ | ✗ | ✗ | ✗ | **✓** ★ |
| **Data residency** | Their cloud | Their cloud | Their cloud | Their cloud | Their cloud | **Your machine** ★ |

**Our five durable advantages:**
1. **Open methodology** — competitors hide how scores are computed. Ours is readable, forkable code. Trust by inspection.
2. **Agent-native** — it lives *inside* Claude. Find a hallucination and have Claude rewrite the page in the same conversation. No dashboard context-switch.
3. **Free + self-hostable** — no procurement, no per-seat tax; your competitive prompt strategy never leaves your machine.
4. **White-label by default** — agencies rebrand freely (Profound's reports are Profound-branded).
5. **Composable** — it's a plugin and an MCP server, so it drops into CI, other agents, and existing pipelines.

---

## The "Brand Visibility on Claude" report — 6 scored dimensions

**Presence** · **Share of Voice** · **Prominence** · **Sources** · **Sentiment & Positioning** · **Accuracy**

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

---

## Architecture (one engine, two frontends)

```
                 ┌────────────────────────────┐
                 │   jusBrandMax core engine   │  ← MIT, self-hostable
                 │  prompt runner · scorers ·  │
                 │  competitors · sources ·    │
                 │  history · report generator │
                 └─────────────┬──────────────┘
              ┌────────────────┴────────────────┐
   CLI plugin (Claude Code)            Cowork plugin (Claude.ai / Desktop)
   slash cmds · subagents · hooks      MCP connector + Agent Skill
        │
        └── also runs as a standalone MCP server + CI/JSON API
```

---

## Quickstart

Requires Node ≥ 20 and pnpm. jusBrandMax is **bring-your-own-key** — set `ANTHROPIC_API_KEY` (it never leaves your machine).

```bash
pnpm install && pnpm -r build

# CLI: scaffold a config, then run a report
export ANTHROPIC_API_KEY=sk-ant-...
node packages/cli/dist/main.js init            # writes brand.config.json (edit it)
node packages/cli/dist/main.js report          # writes brand-report.md + records history
node packages/cli/dist/main.js watch           # shows the trend vs the previous run
```

See a sample config and a generated report in [`examples/`](./examples/) — e.g. [`examples/brand-report.md`](./examples/brand-report.md).

**CLI plugin (Claude Code):** the plugin lives in [`packages/cli/plugin/`](./packages/cli/plugin/) — slash commands `/brand-init`, `/brand-report`, `/brand-watch`.

**Cowork plugin (Claude.ai / Claude Desktop):** an MCP server + Agent Skill. Add it as a custom connector pointing at the `jusbrandmax-mcp` stdio server (`node packages/cowork/dist/main.js`); the bundled [`SKILL.md`](./packages/cowork/skill/SKILL.md) lets a marketer just ask *"How visible is my brand on Claude?"*. Tools: `run_brand_report`, `get_history`, `list_competitors`.

Building it (or curious about the plan/status)? See [`BUILD_GOAL.md`](./BUILD_GOAL.md).

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
