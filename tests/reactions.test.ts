import { test, expect } from 'vitest';
import { site } from '../src/config/site';
import { chipsFor, photoCardId, storyCardId } from '../src/lib/reactions';
import { allCardIds } from '../src/lib/cards';

test('chipsFor: drops zero, sorts by count desc then word order', () =>
  expect(chipsFor({ mid: 2, slay: 2, rizz: 5, sus: 0 }, site.reactions.words).map((c) => c.id)).toEqual([
    'rizz', 'slay', 'mid',
  ]));

test('card ids', () => {
  expect(photoCardId('a.JPG')).toBe('photo:a.JPG');
  expect(storyCardId('x')).toBe('story:x');
});

test('allCardIds has every still and story', () => {
  const ids = allCardIds();
  expect(ids).toContain('story:the-iffk-threesome');
  expect(ids).toContain('story:the-mubi-club-years');
  expect(ids.filter((i) => i.startsWith('photo:'))).toHaveLength(6);
});

test('words match spec', () =>
  expect(site.reactions.words.map((w) => w.label)).toEqual([
    'slay', 'no cap', "it's giving", 'rizz', 'ate', 'based', 'aura +1000', 'delulu', 'mid', 'cooked', 'sus', 'L',
  ]));
