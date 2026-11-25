import { Redis } from '@upstash/redis';

export interface ReactionStore {
  hgetall(key: string): Promise<Record<string, unknown> | null>;
  hincrby(key: string, field: string, by: number): Promise<number>;
  hget(key: string, field: string): Promise<unknown>;
  hset(key: string, values: Record<string, string | number>): Promise<unknown>;
  hdel(key: string, field: string): Promise<unknown>;
}

const countsKey = (card: string) => `reactions:${card}`;
const voterKey = (voterId: string) => `reacted:${voterId}`;

export function reactionStoreFromEnv(env: Record<string, string | undefined>): ReactionStore | null {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token }) as unknown as ReactionStore;
}

const toCount = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

async function cardCounts(store: ReactionStore, card: string, words: string[]): Promise<Record<string, number>> {
  const raw = (await store.hgetall(countsKey(card))) ?? {};
  return Object.fromEntries(words.map((w) => [w, toCount(raw[w])]));
}

export async function getCounts(
  store: ReactionStore,
  cards: string[],
  words: string[],
): Promise<Record<string, Record<string, number>>> {
  const all = await Promise.all(cards.map((c) => cardCounts(store, c, words)));
  return Object.fromEntries(cards.map((c, i) => [c, all[i]]));
}

export async function getMine(store: ReactionStore, voterId: string, cards: string[]): Promise<Record<string, string>> {
  const raw = (await store.hgetall(voterKey(voterId))) ?? {};
  return Object.fromEntries(cards.filter((c) => typeof raw[c] === 'string').map((c) => [c, raw[c] as string]));
}

/** Set (or with null, clear) this voter's single reaction on a card. Returns that card's counts. */
export async function setReaction(
  store: ReactionStore,
  voterId: string,
  card: string,
  word: string | null,
  words: string[],
): Promise<Record<string, number>> {
  const prevRaw = await store.hget(voterKey(voterId), card);
  const prev = typeof prevRaw === 'string' && words.includes(prevRaw) ? prevRaw : null;
  if (prev !== word) {
    if (prev) {
      const left = await store.hincrby(countsKey(card), prev, -1);
      if (left < 0) await store.hset(countsKey(card), { [prev]: 0 });
    }
    if (word) {
      await store.hincrby(countsKey(card), word, 1);
      await store.hset(voterKey(voterId), { [card]: word });
    } else {
      await store.hdel(voterKey(voterId), card);
    }
  }
  return cardCounts(store, card, words);
}
