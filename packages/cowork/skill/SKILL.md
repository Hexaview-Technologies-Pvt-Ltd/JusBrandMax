---
name: brand-visibility-on-claude
description: Measure and improve how a brand shows up in Claude's answers. Use when the user asks how visible their brand is on Claude, what Claude says about them, how they compare to competitors, or whether Claude is wrong about them.
---

# Brand Visibility on Claude

This skill pairs with the **jusBrandMax** MCP connector to measure a brand's
visibility inside Claude's own answers — for non-technical marketers, entirely in chat.

## When to use

The user asks things like: "How visible is my brand on Claude?", "What does Claude
say about us vs. our competitors?", "Is Claude saying anything wrong about us?",
"Has our visibility changed?"

## How to run a report

1. Gather: the **brand name**, any **aliases/product names**, the **top competitors**,
   and a handful of **category questions** a buyer would actually ask Claude
   (5–15 high-intent prompts).
2. Call the **`run_brand_report`** tool with `{ brand, prompts, competitors, aliases }`.
3. Read the returned report and explain, in plain language:
   - the **Overall** score and the six dimensions (Presence, Share of Voice,
     Prominence, Sentiment, Accuracy),
   - where they rank on the **competitor leaderboard**,
   - the **gaps** (prompts where competitors appear and they don't),
   - any **accuracy** issues (claims Claude made that are contradicted/unsupported).
4. Recommend the single highest-impact action and offer to draft the fix.

## Other tools

- **`get_history`** — show the trend across past runs for a brand.
- **`list_competitors`** — the leaderboard from the most recent run.

## Notes

- Reports are computed with open, auditable scoring and stored locally — nothing
  leaves the user's environment except the Claude API calls they pay for (BYO key).
