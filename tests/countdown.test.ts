import { test, expect } from 'vitest';
import { getCountdownState, formatMarried } from '../src/lib/countdown';

const W = new Date('2027-02-03T00:00:00+05:30');

test('before: exact breakdown', () =>
  expect(getCountdownState(new Date('2027-02-01T22:58:57+05:30'), W)).toEqual({
    kind: 'before', days: 1, hours: 1, minutes: 1, seconds: 3,
  }));

test('one ms before → before, at target → live', () => {
  expect(getCountdownState(new Date(W.getTime() - 1), W).kind).toBe('before');
  expect(getCountdownState(W, W)).toEqual({ kind: 'live' });
});

test('London viewer 2 Feb 20:00 GMT = 3 Feb 01:30 IST → live', () =>
  expect(getCountdownState(new Date('2027-02-02T20:00:00Z'), W)).toEqual({ kind: 'live' }));

test('3 Feb 23:59:59 IST still live', () =>
  expect(getCountdownState(new Date('2027-02-03T23:59:59+05:30'), W).kind).toBe('live'));

test('4 Feb 00:00 IST → married 1 day', () =>
  expect(getCountdownState(new Date('2027-02-04T00:00:00+05:30'), W)).toEqual({ kind: 'after', daysMarried: 1 }));

test('London 3 Feb 23:00 GMT (= 4 Feb IST) → after', () =>
  expect(getCountdownState(new Date('2027-02-03T23:00:00Z'), W).kind).toBe('after'));

test('a year later', () =>
  expect(getCountdownState(new Date('2028-02-03T12:00:00+05:30'), W)).toEqual({ kind: 'after', daysMarried: 365 }));

test('wedding later in the day: before until the moment, live after', () => {
  const W10 = new Date('2027-02-03T10:00:00+05:30');
  expect(getCountdownState(new Date('2027-02-03T09:00:00+05:30'), W10)).toEqual({
    kind: 'before', days: 0, hours: 1, minutes: 0, seconds: 0,
  });
  expect(getCountdownState(new Date('2027-02-03T11:00:00+05:30'), W10).kind).toBe('live');
});

test('formatMarried', () => {
  expect(formatMarried(1)).toBe('Married for 1 day');
  expect(formatMarried(12)).toBe('Married for 12 days');
});
