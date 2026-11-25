export interface Word {
  id: string;
  label: string;
}
export interface Chip extends Word {
  count: number;
}

export const photoCardId = (filename: string) => `photo:${filename}`;
export const storyCardId = (id: string) => `story:${id}`;

/** Reactions worth showing as chips: count > 0, most popular first, ties in word-list order. */
export function chipsFor(counts: Record<string, number>, words: Word[]): Chip[] {
  return words
    .map((w, i) => ({ ...w, count: counts[w.id] ?? 0, i }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count || a.i - b.i)
    .map(({ i: _i, ...c }) => c);
}

/** WhatsApp semantics: tapping your current word removes it; any other word becomes your reaction. */
export function nextChoice(current: string | null, picked: string): string | null {
  return current === picked ? null : picked;
}

/** Optimistic count update for one voter moving from `prev` to `next`. */
export function applyLocal(
  counts: Record<string, number>,
  prev: string | null,
  next: string | null,
): Record<string, number> {
  const out = { ...counts };
  if (prev === next) return out;
  if (prev) out[prev] = Math.max(0, (out[prev] ?? 0) - 1);
  if (next) out[next] = (out[next] ?? 0) + 1;
  return out;
}
