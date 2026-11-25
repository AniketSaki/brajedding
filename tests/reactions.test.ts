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

import { nextChoice, applyLocal } from '../src/lib/reactions';

test('nextChoice: pick new, switch, or tap own to remove', () => {
  expect(nextChoice(null, 'slay')).toBe('slay');
  expect(nextChoice('slay', 'mid')).toBe('mid');
  expect(nextChoice('slay', 'slay')).toBeNull();
});

test('applyLocal moves one count, never below zero', () => {
  expect(applyLocal({ slay: 1, mid: 0 }, 'slay', 'mid')).toEqual({ slay: 0, mid: 1 });
  expect(applyLocal({}, 'slay', null)).toEqual({ slay: 0 });
  expect(applyLocal({ sus: 2 }, null, 'sus')).toEqual({ sus: 3 });
});

import { storyIdFromFile } from '../src/lib/cards';

test('story card id matches Astro content id for non-slug filenames', () => {
  expect(storyIdFromFile('the-iffk-threesome.md')).toBe('the-iffk-threesome');
  expect(storyIdFromFile('Mubi_Club Years.md')).toBe('mubi_club-years');
});
