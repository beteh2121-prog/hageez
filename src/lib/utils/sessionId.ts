const STORAGE_KEY = 'affiliate_session_id';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredSession {
  id: string;
  createdAt: number;
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession;
      if (Date.now() - parsed.createdAt < MAX_AGE_MS) {
        return parsed.id;
      }
    }
  } catch {
    // Corrupted storage — fall through and generate a fresh id.
  }

  const id = crypto.randomUUID();
  const stored: StoredSession = { id, createdAt: Date.now() };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage unavailable (private mode / quota) — id still works this visit.
  }

  return id;
}
