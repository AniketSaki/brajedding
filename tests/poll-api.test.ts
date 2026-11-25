import { test, expect } from 'vitest';
import { handlePoll } from '../src/lib/pollHandler';
import type { CounterStore } from '../src/lib/pollStore';
import { site } from '../src/config/site';

const opts = site.poll.options;
const URL_ = 'https://brajedding.test/api/poll';

function fakeStore(): CounterStore & { data: Record<string, number> } {
  const data: Record<string, number> = {};
  return {
    data,
    async hgetall() { return Object.keys(data).length ? { ...data } : null; },
    async hincrby(_k, field, by) { data[field] = (data[field] ?? 0) + by; return data[field]; },
  };
}
const brokenStore: CounterStore = {
  hgetall: async () => { throw new Error('down'); },
  hincrby: async () => { throw new Error('down'); },
};
const post = (body: string, headers: Record<string, string> = {}) =>
  new Request(URL_, { method: 'POST', body, headers: { 'content-type': 'application/json', ...headers } });

test('GET returns counts for all options', async () => {
  const res = await handlePoll(new Request(URL_), fakeStore(), opts);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ counts: { physical: 0, digital: 0, thinking: 0, gatecrash: 0 } });
  expect(res.headers.get('cache-control')).toBe('no-store');
});

test('POST valid option increments and sets voted cookie', async () => {
  const store = fakeStore();
  const res = await handlePoll(post('{"option":"physical"}'), store, opts);
  expect(res.status).toBe(200);
  expect((await res.json()).counts.physical).toBe(1);
  const cookie = res.headers.get('set-cookie') ?? '';
  expect(cookie).toContain('voted=1');
  expect(cookie).toContain('HttpOnly');
  expect(Number(/Max-Age=(\d+)/.exec(cookie)?.[1])).toBeGreaterThanOrEqual(31536000);
});

test('POST unknown option → 400', async () => {
  const store = fakeStore();
  const res = await handlePoll(post('{"option":"hacked"}'), store, opts);
  expect(res.status).toBe(400);
  expect(store.data).toEqual({});
});

test('POST malformed JSON → 400', async () => {
  const res = await handlePoll(post('not json'), fakeStore(), opts);
  expect(res.status).toBe(400);
});

test('POST with voted cookie → 409 and current counts, no increment', async () => {
  const store = fakeStore();
  store.data.digital = 2;
  const res = await handlePoll(post('{"option":"physical"}', { cookie: 'a=b; voted=1' }), store, opts);
  expect(res.status).toBe(409);
  expect((await res.json()).counts).toEqual({ physical: 0, digital: 2, thinking: 0, gatecrash: 0 });
  expect(store.data.physical).toBeUndefined();
});

test('store null (env missing) → 503 {error}', async () => {
  const res = await handlePoll(new Request(URL_), null, opts);
  expect(res.status).toBe(503);
  expect((await res.json()).error).toBeTruthy();
});

test('store throws → 503 {error}', async () => {
  const res = await handlePoll(post('{"option":"physical"}'), brokenStore, opts);
  expect(res.status).toBe(503);
  expect((await res.json()).error).toBeTruthy();
});

test('other methods → 405', async () => {
  const res = await handlePoll(new Request(URL_, { method: 'DELETE' }), fakeStore(), opts);
  expect(res.status).toBe(405);
});
