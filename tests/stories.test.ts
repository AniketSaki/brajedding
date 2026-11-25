import { test, expect } from 'vitest';
import { teaserFrom, starString, sortStories } from '../src/lib/stories';

test('teaser = first paragraph, markdown stripped', () =>
  expect(teaserFrom('# Hi\n\nHe **forgot** the [tickets](x).\n\nMore.')).toBe('He forgot the tickets.'));

test('long teaser truncated at word boundary, ellipsis included in limit', () => {
  const t = teaserFrom('word '.repeat(100), 20);
  expect(t).toBe('word word word word…');
  expect(t.length).toBeLessThanOrEqual(20);
});

test('stars', () => {
  expect(starString(4)).toBe('★★★★☆');
  expect(starString(5)).toBe('★★★★★');
});

test('sort by order then title', () =>
  expect(
    sortStories([{ data: { title: 'b' } }, { data: { title: 'a', order: 2 } }, { data: { title: 'c', order: 1 } }]).map(
      (s) => s.data.title,
    ),
  ).toEqual(['c', 'a', 'b']));

test('never exceeds limit when a space falls right at the limit', () => {
  const t = teaserFrom('aaaa bbbb cccc ddddd eeee ffff', 20);
  expect(t.length).toBeLessThanOrEqual(20);
  expect(t).toBe('aaaa bbbb cccc…');
});
