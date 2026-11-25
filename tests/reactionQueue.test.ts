import { test, expect } from 'vitest';
import { createReactionQueue } from '../src/lib/reactionQueue';

function deferred<T>() {
  let resolve!: (v: T) => void, reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

function harness() {
  const sent: (string | null)[] = [];
  const pending: ReturnType<typeof deferred<string>>[] = [];
  const applied: string[] = [];
  const failed: string[] = [];
  const q = createReactionQueue<string>(
    (_card, word) => { sent.push(word); const d = deferred<string>(); pending.push(d); return d.promise; },
    (card, r) => applied.push(`${card}:${r}`),
    (card) => failed.push(card),
  );
  return { q, sent, pending, applied, failed };
}

test('one tap → one request, result applied', async () => {
  const h = harness();
  h.q.set('c', 'slay');
  h.pending[0].resolve('r1');
  await tick();
  expect(h.sent).toEqual(['slay']);
  expect(h.applied).toEqual(['c:r1']);
});

test('taps while in flight never overlap; only the latest state is sent next', async () => {
  const h = harness();
  h.q.set('c', 'slay');
  h.q.set('c', 'mid');
  h.q.set('c', 'cooked');
  expect(h.sent).toEqual(['slay']); // nothing overlapping
  h.pending[0].resolve('r-slay');
  await tick();
  expect(h.sent).toEqual(['slay', 'cooked']);
  expect(h.applied).toEqual([]); // stale result not applied
  h.pending[1].resolve('r-cooked');
  await tick();
  expect(h.applied).toEqual(['c:r-cooked']);
});

test('tap, untap, retap while in flight → no extra request', async () => {
  const h = harness();
  h.q.set('c', 'slay');
  h.q.set('c', null);
  h.q.set('c', 'slay');
  h.pending[0].resolve('r1');
  await tick();
  expect(h.sent).toEqual(['slay']);
  expect(h.applied).toEqual(['c:r1']);
});

test('cards are independent', async () => {
  const h = harness();
  h.q.set('a', 'slay');
  h.q.set('b', 'mid');
  expect(h.sent).toEqual(['slay', 'mid']);
});

test('failure reports the card and does not apply', async () => {
  const h = harness();
  h.q.set('c', 'slay');
  h.pending[0].reject(new Error('503'));
  await tick();
  expect(h.failed).toEqual(['c']);
  expect(h.applied).toEqual([]);
});
