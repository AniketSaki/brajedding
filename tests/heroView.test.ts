import { test, expect } from 'vitest';
import { heroView, safeStreamUrl } from '../src/lib/heroView';

test('before: countdown + badge, no status', () =>
  expect(heroView({ kind: 'before', days: 1, hours: 0, minutes: 0, seconds: 0 }, '')).toEqual({
    showCountdown: true, showBadge: true, status: null,
  }));

test('live: badge hidden (no "live soon" next to "live now")', () =>
  expect(heroView({ kind: 'live' }, '')).toEqual({
    showCountdown: false, showBadge: false, status: { text: '🔴 STREAMING LIVE NOW', href: null },
  }));

test('live with stream link → href', () =>
  expect(heroView({ kind: 'live' }, 'https://youtu.be/abc').status).toEqual({
    text: '🔴 STREAMING LIVE NOW', href: 'https://youtu.be/abc',
  }));

test('after: badge hidden, married text', () =>
  expect(heroView({ kind: 'after', daysMarried: 3 }, 'https://x.test')).toEqual({
    showCountdown: false, showBadge: false, status: { text: 'Married for 3 days', href: null },
  }));

test('safeStreamUrl keeps percent-encoding intact (no double encoding)', () =>
  expect(safeStreamUrl('https://example.com/live%20now?t=1')).toBe('https://example.com/live%20now?t=1'));

test('safeStreamUrl rejects non-https and junk', () => {
  expect(safeStreamUrl('javascript:alert(1)')).toBeNull();
  expect(safeStreamUrl('http://example.com')).toBeNull();
  expect(safeStreamUrl('not a url')).toBeNull();
  expect(safeStreamUrl('')).toBeNull();
});
