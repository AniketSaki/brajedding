import type { PollOption } from '../config/site';

export interface TallyRow {
  id: string;
  label: string;
  count: number;
  percent: number;
}

function toCount(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Counts per configured option (unknown keys ignored), with whole-number percentages. */
export function tally(counts: Record<string, unknown>, options: PollOption[]): { rows: TallyRow[]; total: number } {
  const raw = options.map((o) => ({ id: o.id, label: o.label, count: toCount(counts[o.id]) }));
  const total = raw.reduce((sum, r) => sum + r.count, 0);
  return {
    total,
    rows: raw.map((r) => ({ ...r, percent: total ? Math.round((r.count / total) * 100) : 0 })),
  };
}
