import { test, expect } from 'vitest';
import { handleReactions } from '../src/lib/reactionsHandler';
import type { ReactionStore } from '../src/lib/reactionStore';
import { site } from '../src/config/site';

const CARDS = ['story:a', 'photo:b.JPG'];
const WORDS = site.reactions.words.map((w) => w.id);
const NEW_ID = '11111111-1111-4111-8111-111111111111';
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const opts = { cards: CARDS, words: WORDS, newVoterId: () => NEW_ID };
const URL_ = 'https://brajedding.test/api/reactions';

function fakeStore() {
  const h = new Map<string, Map<string, string>>();
  const get = (k: string) => h.get(k) ?? h.set(k, new Map()).get(k)!;
  const store: ReactionStore & { h: typeof h } = {
    h,
    async hgetall(k) { const m = h.get(k); return m && m.size ? Object.fromEntries(m) : null; },
    async hincrby(k, f, by) { const m = get(k); const v = Number(m.get(f) ?? 0) + by; m.set(f, String(v)); return v; },
    async hget(k, f) { return h.get(k)?.get(f) ?? null; },
    async hset(k, vals) { const m = get(k); for (const [f, v] of Object.entries(vals)) m.set(f, String(v)); return 1; },
    async hdel(k, f) { return h.get(k)?.delete(f) ? 1 : 0; },
  };
  return store;
}
const broken: ReactionStore = {
  hgetall: async () => { throw new Error('down'); },
  hincrby: async () => { throw new Error('down'); },
  hget: async () => { throw new Error('down'); },
  hset: async () => { throw new Error('down'); },
  hdel: async () => { throw new Error('down'); },
};
const post = (body: unknown, rid?: string) =>
  new Request(URL_, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...(rid ? { cookie: `x=1; rid=${rid}` } : {}) },
  });
const get = (rid?: string) => new Request(URL_, { headers: rid ? { cookie: `rid=${rid}` } : {} });

test('GET empty → zeroed counts for all cards, mine {}', async () => {
  const res = await handleReactions(get(), fakeStore(), opts);
  expect(res.status).toBe(200);
  expect(res.headers.get('cache-control')).toBe('no-store');
  const body = await res.json();
  expect(Object.keys(body.counts)).toEqual(CARDS);
  expect(body.counts['story:a'].slay).toBe(0);
  expect(Object.keys(body.counts['story:a'])).toHaveLength(12);
  expect(body.mine).toEqual({});
});

test('POST new reaction → count 1, mine set, rid cookie issued', async () => {
  const res = await handleReactions(post({ card: 'story:a', word: 'slay' }), fakeStore(), opts);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toMatchObject({ card: 'story:a', mine: 'slay' });
  expect(body.counts.slay).toBe(1);
  const cookie = res.headers.get('set-cookie') ?? '';
  expect(cookie).toContain(`rid=${NEW_ID}`);
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('Max-Age=31536000');
});

test('same word twice is idempotent', async () => {
  const s = fakeStore();
  await handleReactions(post({ card: 'story:a', word: 'slay' }, A), s, opts);
  const res = await handleReactions(post({ card: 'story:a', word: 'slay' }, A), s, opts);
  expect((await res.json()).counts.slay).toBe(1);
});

test('switch word moves the count', async () => {
  const s = fakeStore();
  await handleReactions(post({ card: 'story:a', word: 'slay' }, A), s, opts);
  const body = await (await handleReactions(post({ card: 'story:a', word: 'mid' }, A), s, opts)).json();
  expect(body.counts.slay).toBe(0);
  expect(body.counts.mid).toBe(1);
  expect(body.mine).toBe('mid');
});

test('word null removes', async () => {
  const s = fakeStore();
  await handleReactions(post({ card: 'story:a', word: 'slay' }, A), s, opts);
  const body = await (await handleReactions(post({ card: 'story:a', word: null }, A), s, opts)).json();
  expect(body.counts.slay).toBe(0);
  expect(body.mine).toBeNull();
});

test('two voters counted separately', async () => {
  const s = fakeStore();
  await handleReactions(post({ card: 'story:a', word: 'slay' }, A), s, opts);
  const body = await (await handleReactions(post({ card: 'story:a', word: 'slay' }, B), s, opts)).json();
  expect(body.counts.slay).toBe(2);
});

test('decrement never below zero', async () => {
  const s = fakeStore();
  await handleReactions(post({ card: 'story:a', word: 'slay' }, A), s, opts);
  s.h.delete('reactions:story:a'); // counts reset in console, voter record remains
  const body = await (await handleReactions(post({ card: 'story:a', word: 'mid' }, A), s, opts)).json();
  expect(body.counts.slay).toBe(0);
  expect(body.counts.mid).toBe(1);
});

test('invalid rid cookie gets a new id', async () => {
  const res = await handleReactions(post({ card: 'story:a', word: 'slay' }, 'garbage'), fakeStore(), opts);
  expect(res.status).toBe(200);
  expect(res.headers.get('set-cookie') ?? '').toContain(`rid=${NEW_ID}`);
});

test('GET returns mine for known voter', async () => {
  const s = fakeStore();
  await handleReactions(post({ card: 'photo:b.JPG', word: 'aura' }, A), s, opts);
  const body = await (await handleReactions(get(A), s, opts)).json();
  expect(body.mine).toEqual({ 'photo:b.JPG': 'aura' });
  expect(body.counts['photo:b.JPG'].aura).toBe(1);
});

test('unknown card → 400, nothing written', async () => {
  const s = fakeStore();
  const res = await handleReactions(post({ card: 'photo:deleted.JPG', word: 'slay' }, A), s, opts);
  expect(res.status).toBe(400);
  expect(s.h.size).toBe(0);
});

test('unknown word → 400', async () => {
  const res = await handleReactions(post({ card: 'story:a', word: 'yeet' }, A), fakeStore(), opts);
  expect(res.status).toBe(400);
});

test('malformed JSON → 400', async () => {
  const res = await handleReactions(post('nope', A), fakeStore(), opts);
  expect(res.status).toBe(400);
});

test('store null → 503; store throws → 503', async () => {
  expect((await handleReactions(get(), null, opts)).status).toBe(503);
  expect((await handleReactions(post({ card: 'story:a', word: 'slay' }, A), broken, opts)).status).toBe(503);
});

test('other methods → 405', async () => {
  const res = await handleReactions(new Request(URL_, { method: 'PUT' }), fakeStore(), opts);
  expect(res.status).toBe(405);
});

test('GET without cookie issues rid so first taps share one voter', async () => {
  const res = await handleReactions(get(), fakeStore(), opts);
  expect(res.headers.get('set-cookie') ?? '').toContain(`rid=${NEW_ID}`);
  const again = await handleReactions(get(A), fakeStore(), opts);
  expect(again.headers.get('set-cookie')).toBeNull();
});
