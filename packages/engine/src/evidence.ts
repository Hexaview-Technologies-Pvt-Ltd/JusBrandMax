/**
 * Evidence extraction — the verbatim quotes behind every score.
 *
 * Trust-by-inspection: instead of a black-box number, the report can show the
 * actual sentences Claude produced. For each prompt we surface the sentence that
 * mentions the brand; if the brand is absent, we surface what won instead (a
 * competitor sentence), so the gap is visible in Claude's own words.
 */
import { detectMention } from "./mentions.js";
import type { AskResult } from "./provider.js";

export interface EvidenceQuote {
  prompt: string;
  quote: string;
  /** true = the quote mentions the brand; false = it's what appeared instead. */
  brand: boolean;
}

function firstSentenceWith(text: string, names: string[]): string | null {
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const s of sentences) {
    if (detectMention(s, names).matched) return s.trim();
  }
  return null;
}

export function extractEvidence(
  runs: AskResult[],
  brandNames: string[],
  competitors: string[],
  limit = 12,
): EvidenceQuote[] {
  const out: EvidenceQuote[] = [];
  for (const r of runs) {
    let added = false;
    for (const resp of r.responses) {
      const q = firstSentenceWith(resp, brandNames);
      if (q) {
        out.push({ prompt: r.prompt, quote: q, brand: true });
        added = true;
        break;
      }
    }
    if (!added) {
      for (const resp of r.responses) {
        const q = firstSentenceWith(resp, competitors);
        if (q) {
          out.push({ prompt: r.prompt, quote: q, brand: false });
          break;
        }
      }
    }
    if (out.length >= limit) break;
  }
  return out;
}
