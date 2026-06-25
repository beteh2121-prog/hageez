'use client';

import { getOrCreateSessionId } from '@/lib/utils/sessionId';

const DEDUP_WINDOW_MS = 30 * 60 * 1000;

export function useTrackClick() {
  function trackClick(bookId: string, marketplace: string): void {
    if (typeof window === 'undefined') return;

    const dedupKey = `ac_${bookId}`;
    const lastClicked = window.localStorage.getItem(dedupKey);

    if (lastClicked && Date.now() - Number(lastClicked) < DEDUP_WINDOW_MS) {
      return;
    }

    window.localStorage.setItem(dedupKey, String(Date.now()));

    const sessionId = getOrCreateSessionId();

    fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book_id: bookId,
        session_id: sessionId,
        referrer_url: window.location.href,
        marketplace,
      }),
    }).catch(() => {
      // Fire-and-forget — tracking failures must never block navigation.
    });
  }

  return { trackClick };
}
