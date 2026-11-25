import type { APIRoute } from 'astro';
import { site } from '../../config/site';
import { allCardIds } from '../../lib/cards';
import { handleReactions } from '../../lib/reactionsHandler';
import { reactionStoreFromEnv } from '../../lib/reactionStore';

export const prerender = false;

const env = (): Record<string, string | undefined> => ({ ...import.meta.env, ...process.env });
const words = site.reactions.words.map((w) => w.id);

const handler: APIRoute = ({ request }) =>
  handleReactions(request, reactionStoreFromEnv(env()), {
    cards: allCardIds(),
    words,
    newVoterId: () => crypto.randomUUID(),
  });

export const GET = handler;
export const POST = handler;
export const ALL = handler;
