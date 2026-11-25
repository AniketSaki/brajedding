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
