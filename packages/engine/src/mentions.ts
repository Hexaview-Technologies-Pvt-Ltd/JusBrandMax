/**
 * Mention detection — the primitive every scorer builds on.
 *
 * Case-insensitive, Unicode-aware, and boundary-aware so "Acme" matches
 * "acme is great" but not "Acmecorp". Brand names with punctuation (AT&T,
 * Coca-Cola) are matched literally.
 */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface MentionHit {
  matched: boolean;
  /** Number of occurrences. */
  count: number;
  /** Character index of the first occurrence, or -1 if none. */
  firstIndex: number;
}

/** Build a boundary-aware, case-insensitive alternation regex, or null if no names. */
export function buildMentionRegex(names: string[]): RegExp | null {
  const clean = names.map((n) => n.trim()).filter(Boolean).map(escapeRegExp);
  if (clean.length === 0) return null;
  // Boundaries use Unicode letter/number classes instead of \b so that names
  // containing punctuation still anchor correctly.
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${clean.join("|")})(?![\\p{L}\\p{N}])`, "giu");
}

export function detectMention(text: string, names: string[]): MentionHit {
  const re = buildMentionRegex(names);
  if (!re) return { matched: false, count: 0, firstIndex: -1 };

  let count = 0;
  let firstIndex = -1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (firstIndex === -1) firstIndex = m.index;
    count += 1;
    if (m.index === re.lastIndex) re.lastIndex += 1; // guard against zero-width loops
  }
  return { matched: count > 0, count, firstIndex };
}
