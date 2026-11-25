import type { APIRoute } from 'astro';
import { site } from '../../config/site';
import { handlePoll } from '../../lib/pollHandler';
import { storeFromEnv } from '../../lib/pollStore';

export const prerender = false;

// process.env carries Vercel's runtime env; import.meta.env adds values from a local .env in `astro dev`.
const env = (): Record<string, string | undefined> => ({ ...import.meta.env, ...process.env });

const handler: APIRoute = ({ request }) => handlePoll(request, storeFromEnv(env()), site.poll.options);

export const GET = handler;
export const POST = handler;
export const ALL = handler;
