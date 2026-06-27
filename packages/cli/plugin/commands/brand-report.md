---
description: Run a full Brand Visibility on Claude report and summarize the findings.
---

Generate a Brand Visibility on Claude report.

1. Confirm `brand.config.json` exists (run `/brand-init` first if not) and that `ANTHROPIC_API_KEY` is set.
2. Run: `jusbrandmax report --config brand.config.json --out brand-report.md`
3. Read the printed summary and the generated `brand-report.md`. Present the user:
   - the **Overall** score and the six dimensions (Presence, Share of Voice, Prominence, Sentiment, Accuracy),
   - the **competitor leaderboard** and where they rank,
   - the **gaps** (prompts where competitors appear and they don't),
   - any **accuracy** problems (contradicted/unsupported claims Claude made about them).
4. Offer concrete next actions: fix the worst gap, correct the most damaging hallucination, or improve the lowest dimension. If the user wants, draft the fix (a page, FAQ, or correction) in the same session and re-run the report.
