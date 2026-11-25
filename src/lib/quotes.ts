/** Pick a random quote, never the same as `previous` (unless it is the only one). */
export function pickQuote(quotes: string[], previous: string | null, rand: () => number = Math.random): string {
  if (quotes.length === 0) throw new Error('No quotes to pick from');
  const pool = quotes.length > 1 && previous !== null ? quotes.filter((q) => q !== previous) : quotes;
  const choices = pool.length ? pool : quotes;
  return choices[Math.min(Math.floor(rand() * choices.length), choices.length - 1)];
}
