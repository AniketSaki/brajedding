import { test, expect } from 'vitest';
import { tally } from '../src/lib/poll';
import { storeFromEnv } from '../src/lib/pollStore';
import { site } from '../src/config/site';

const opts = site.poll.options;

test('zero votes → 0% each, total 0, no NaN', () => {
  const t = tally({}, opts);
  expect(t.total).toBe(0);
  expect(t.rows.every((r) => r.percent === 0)).toBe(true);
  expect(t.rows.map((r) => r.id)).toEqual(['physical', 'digital', 'thinking', 'gatecrash']);
});

test('percent rounding and string counts from redis', () =>
  expect(tally({ physical: '1', digital: '2' }, opts).rows.map((r) => r.percent)).toEqual([33, 67, 0, 0]));

test('unknown keys in store ignored', () => expect(tally({ physical: 1, hacked: 99 }, opts).total).toBe(1));

test('garbage counts treated as 0', () => expect(tally({ physical: 'abc', digital: -3 }, opts).total).toBe(0));

test('storeFromEnv returns null without env', () => expect(storeFromEnv({})).toBeNull());

test('storeFromEnv accepts Upstash or Vercel KV names', () => {
  expect(storeFromEnv({ UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' })).not.toBeNull();
  expect(storeFromEnv({ KV_REST_API_URL: 'https://x.upstash.io', KV_REST_API_TOKEN: 't' })).not.toBeNull();
});
