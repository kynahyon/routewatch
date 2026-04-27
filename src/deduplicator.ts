/**
 * Deduplicator: suppresses repeated alerts for the same route within a cooldown window.
 */

export interface DeduplicatorOptions {
  /** Cooldown period in milliseconds before the same route can trigger another alert */
  cooldownMs?: number;
}

export interface DeduplicatorEntry {
  lastAlertAt: number;
  count: number;
}

export interface Deduplicator {
  shouldAlert: (routeKey: string) => boolean;
  record: (routeKey: string) => void;
  getEntry: (routeKey: string) => DeduplicatorEntry | undefined;
  reset: (routeKey?: string) => void;
}

const DEFAULT_COOLDOWN_MS = 60_000; // 1 minute

export function createDeduplicator(options: DeduplicatorOptions = {}): Deduplicator {
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const entries = new Map<string, DeduplicatorEntry>();

  function shouldAlert(routeKey: string): boolean {
    const entry = entries.get(routeKey);
    if (!entry) return true;
    const elapsed = Date.now() - entry.lastAlertAt;
    return elapsed >= cooldownMs;
  }

  function record(routeKey: string): void {
    const existing = entries.get(routeKey);
    entries.set(routeKey, {
      lastAlertAt: Date.now(),
      count: existing ? existing.count + 1 : 1,
    });
  }

  function getEntry(routeKey: string): DeduplicatorEntry | undefined {
    return entries.get(routeKey);
  }

  function reset(routeKey?: string): void {
    if (routeKey !== undefined) {
      entries.delete(routeKey);
    } else {
      entries.clear();
    }
  }

  return { shouldAlert, record, getEntry, reset };
}
