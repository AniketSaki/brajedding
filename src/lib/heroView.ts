import { formatMarried, type CountdownState } from './countdown';

export interface HeroView {
  showCountdown: boolean;
  showBadge: boolean;
  status: { text: string; href: string | null } | null;
}

/** Only well-formed https links, returned exactly as written (no re-encoding). */
export function safeStreamUrl(url: string): string | null {
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export function heroView(state: CountdownState, streamUrl: string): HeroView {
  if (state.kind === 'before') return { showCountdown: true, showBadge: true, status: null };
  if (state.kind === 'live') {
    return {
      showCountdown: false,
      showBadge: false,
      status: { text: '🔴 STREAMING LIVE NOW', href: safeStreamUrl(streamUrl) },
    };
  }
  return { showCountdown: false, showBadge: false, status: { text: formatMarried(state.daysMarried), href: null } };
}
