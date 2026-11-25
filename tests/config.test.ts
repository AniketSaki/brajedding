import { test, expect } from 'vitest';
import { site } from '../src/config/site';
import quotes from '../src/data/quotes.json';

test('wedding is 3 Feb 2027 00:00 IST', () =>
  expect(new Date(site.weddingAt).toISOString()).toBe('2027-02-02T18:30:00.000Z'));

test('poll option ids are unique and match spec', () =>
  expect(site.poll.options.map((o) => o.id)).toEqual(['physical', 'digital', 'thinking', 'gatecrash']));

test('quotes non-empty, all non-blank strings', () => {
  expect(quotes.length).toBeGreaterThan(0);
  for (const q of quotes) expect(q.trim()).not.toBe('');
});

test('streamUrl empty or https', () =>
  expect(site.streamUrl === '' || site.streamUrl.startsWith('https://')).toBe(true));
