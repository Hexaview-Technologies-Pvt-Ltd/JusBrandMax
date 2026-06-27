---
description: Scaffold a jusBrandMax config (brand, competitors, prompts) for a Brand Visibility on Claude report.
---

Set up a Brand Visibility on Claude run for the user.

1. Ensure the `jusbrandmax` CLI is available (it ships with this plugin; if not, run it via `npx @jusbrandmax/cli`).
2. Run `jusbrandmax init` in the project directory to write a sample `brand.config.json`.
3. Ask the user for their brand name, any aliases/product names, their top competitors, and the category. Edit `brand.config.json` accordingly — replace the placeholder prompts with real questions a buyer would ask Claude about that category.
4. Remind the user that `report` needs `ANTHROPIC_API_KEY` set (bring-your-own-key; it never leaves their machine).

Keep the prompt set focused (5–15 high-intent questions). Confirm the final config back to the user.
