import { getCounts, getMine, setReaction, type ReactionStore } from './reactionStore';

const ONE_YEAR = 60 * 60 * 24 * 365;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra },
  });
}

function voterFrom(req: Request): string | null {
  const m = /(?:^|;\s*)rid=([^;]+)/.exec(req.headers.get('cookie') ?? '');
  return m && UUID_V4.test(m[1]) ? m[1] : null;
}

export async function handleReactions(
  req: Request,
  store: ReactionStore | null,
  opts: { cards: string[]; words: string[]; newVoterId: () => string },
): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'POST') return json(405, { error: 'Method not allowed' }, { allow: 'GET, POST' });
  if (!store) return json(503, { error: 'Reactions storage is not configured' });

  try {
    const existing = voterFrom(req);
    if (req.method === 'GET') {
      const [counts, mine] = await Promise.all([
        getCounts(store, opts.cards, opts.words),
        existing ? getMine(store, existing, opts.cards) : Promise.resolve({}),
      ]);
      return json(200, { counts, mine });
    }

    let body: { card?: unknown; word?: unknown };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return json(400, { error: 'Invalid JSON' });
    }
    const { card, word } = body ?? {};
    if (typeof card !== 'string' || !opts.cards.includes(card)) return json(400, { error: 'Unknown card' });
    if (word !== null && (typeof word !== 'string' || !opts.words.includes(word))) {
      return json(400, { error: 'Unknown reaction' });
    }

    const voterId = existing ?? opts.newVoterId();
    const counts = await setReaction(store, voterId, card, word, opts.words);
    const headers: Record<string, string> = {};
    if (!existing) {
      const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
      headers['set-cookie'] = `rid=${voterId}; Max-Age=${ONE_YEAR}; Path=/; HttpOnly; SameSite=Lax${secure}`;
    }
    return json(200, { card, counts, mine: word }, headers);
  } catch (err) {
    console.error('reactions error', err);
    return json(503, { error: 'Reactions are temporarily unavailable' });
  }
}
