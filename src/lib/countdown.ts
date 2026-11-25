export type CountdownState =
  | { kind: 'before'; days: number; hours: number; minutes: number; seconds: number }
  | { kind: 'live' }
  | { kind: 'after'; daysMarried: number };

const IST_OFFSET_MS = 330 * 60 * 1000; // UTC+05:30, no DST
const DAY_MS = 86_400_000;

/** Index of the IST calendar day containing `d` (days since epoch, in IST). */
function istDayIndex(d: Date): number {
  return Math.floor((d.getTime() + IST_OFFSET_MS) / DAY_MS);
}

export function getCountdownState(now: Date, weddingAt: Date): CountdownState {
  const diff = weddingAt.getTime() - now.getTime();
  if (diff > 0) {
    const total = Math.floor(diff / 1000);
    return {
      kind: 'before',
      days: Math.floor(total / 86_400),
      hours: Math.floor((total % 86_400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
    };
  }
  const daysMarried = istDayIndex(now) - istDayIndex(weddingAt);
  return daysMarried <= 0 ? { kind: 'live' } : { kind: 'after', daysMarried };
}

export function formatMarried(days: number): string {
  return `Married for ${days} ${days === 1 ? 'day' : 'days'}`;
}
