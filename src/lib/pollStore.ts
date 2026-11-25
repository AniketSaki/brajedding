import { Redis } from '@upstash/redis';
import type { PollOption } from '../config/site';
import { tally } from './poll';

export interface CounterStore {
  hgetall(key: string): Promise<Record<string, unknown> | null>;
  hincrby(key: string, field: string, by: number): Promise<number>;
}

export const POLL_KEY = 'poll:invite';

/** Upstash Redis from env (direct Upstash names or the Vercel KV/Marketplace names); null if not configured. */
export function storeFromEnv(env: Record<string, string | undefined>): CounterStore | null {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token }) as unknown as CounterStore;
}

export async function getCounts(store: CounterStore, options: PollOption[]): Promise<Record<string, number>> {
  const raw = (await store.hgetall(POLL_KEY)) ?? {};
  return Object.fromEntries(tally(raw, options).rows.map((r) => [r.id, r.count]));
}

export async function vote(store: CounterStore, optionId: string, options: PollOption[]): Promise<Record<string, number>> {
  await store.hincrby(POLL_KEY, optionId, 1);
  return getCounts(store, options);
}
