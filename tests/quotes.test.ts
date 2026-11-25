import { test, expect } from 'vitest';
import { pickQuote } from '../src/lib/quotes';

test('never repeats previous when >1 quote', () => {
  for (let i = 0; i < 200; i++) expect(pickQuote(['a', 'b'], 'a')).toBe('b');
});

test('single quote returns it (no infinite loop)', () =>
  expect(pickQuote(['only'], 'only')).toBe('only'));

test('uses rand for index', () =>
  expect(pickQuote(['a', 'b', 'c'], null, () => 0.99)).toBe('c'));

test('empty list throws', () => expect(() => pickQuote([], null)).toThrow());
