import type { PollOption } from '../config/site';
import { getCounts, vote, type CounterStore } from './pollStore';

const ONE_YEAR = 60 * 60 * 24 * 365;

function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra },
  });
}

const hasVotedCookie = (req: Request) => /(?:^|;\s*)voted=1(?:;|$)/.test(req.headers.get('cookie') ?? '');

export async function handlePoll(req: Request, store: CounterStore | null, options: PollOption[]): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'POST') return json(405, { error: 'Method not allowed' }, { allow: 'GET, POST' });
  if (!store) return json(503, { error: 'Poll storage is not configured' });

  try {
    if (req.method === 'GET') return json(200, { counts: await getCounts(store, options) });

    let option: unknown;
    try {
      option = ((await req.json()) as { option?: unknown })?.option;
    } catch {
      return json(400, { error: 'Invalid JSON' });
    }
    if (typeof option !== 'string' || !options.some((o) => o.id === option)) {
      return json(400, { error: 'Unknown option' });
    }
    if (hasVotedCookie(req)) return json(409, { error: 'Already voted', counts: await getCounts(store, options) });

    const counts = await vote(store, option, options);
    const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
    return json(200, { counts }, {
      'set-cookie': `voted=1; Max-Age=${ONE_YEAR}; Path=/; HttpOnly; SameSite=Lax${secure}`,
    });
  } catch (err) {
    console.error('poll error', err);
    return json(503, { error: 'Poll is temporarily unavailable' });
  }
}
