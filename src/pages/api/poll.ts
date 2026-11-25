import type { APIRoute } from 'astro';
import { site } from '../../config/site';
import { handlePoll } from '../../lib/pollHandler';
import { storeFromEnv } from '../../lib/pollStore';

export const prerender = false;

const handler: APIRoute = ({ request }) => handlePoll(request, storeFromEnv(process.env), site.poll.options);

export const GET = handler;
export const POST = handler;
export const ALL = handler;
