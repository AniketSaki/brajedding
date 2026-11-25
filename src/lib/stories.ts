/** First real paragraph of a markdown body, as plain text, truncated at a word boundary. */
export function teaserFrom(markdownBody: string, maxChars = 160): string {
  const para =
    markdownBody
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith('#') && !p.startsWith('![') && !p.startsWith('>')) ?? '';
  const text = para
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars); // leave room for the ellipsis
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : text.slice(0, maxChars)).trimEnd()}…`;
}

export function starString(rating: number): string {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

export function sortStories<T extends { data: { order?: number; title: string } }>(s: T[]): T[] {
  return [...s].sort((a, b) => {
    const ao = a.data.order ?? Infinity;
    const bo = b.data.order ?? Infinity;
    return ao !== bo ? ao - bo : a.data.title.localeCompare(b.data.title);
  });
}
