/**
 * One request in flight per card. Taps made while a request is in flight only update the
 * desired state; when the request settles, the latest desired state is sent if it differs.
 * Only the response for the final state is applied, so stale responses never win.
 */
export function createReactionQueue<R>(
  send: (card: string, word: string | null) => Promise<R>,
  apply: (card: string, result: R) => void,
  fail: (card: string) => void,
) {
  const desired = new Map<string, string | null>();
  const busy = new Set<string>();

  async function run(card: string) {
    busy.add(card);
    let sent: string | null | undefined;
    try {
      while (sent === undefined || desired.get(card) !== sent) {
        sent = desired.get(card) ?? null;
        const result = await send(card, sent);
        if (desired.get(card) === sent) {
          apply(card, result);
          break;
        }
      }
    } catch {
      fail(card);
    } finally {
      busy.delete(card);
    }
  }

  return {
    set(card: string, word: string | null) {
      desired.set(card, word);
      if (!busy.has(card)) void run(card);
    },
  };
}
