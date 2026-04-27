/**
 * retry-tracker.ts
 * Tracks repeated slow/failing requests to the same route
 * and emits alerts when retry thresholds are exceeded.
 */

export interface RetryEntry {
  route: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

export interface RetryTrackerOptions {
  /** Number of repeated slow hits before alerting */
  threshold?: number;
  /** Window in ms to count retries within */
  windowMs?: number;
  /** Callback invoked when retry threshold is breached */
  onThresholdReached?: (entry: RetryEntry) => void;
}

export interface RetryTracker {
  record: (route: string) => void;
  getEntry: (route: string) => RetryEntry | undefined;
  reset: (route?: string) => void;
}

export function createRetryTracker(options: RetryTrackerOptions = {}): RetryTracker {
  const threshold = options.threshold ?? 3;
  const windowMs = options.windowMs ?? 60_000;
  const onThresholdReached = options.onThresholdReached;

  const entries = new Map<string, RetryEntry>();

  function record(route: string): void {
    const now = Date.now();
    const existing = entries.get(route);

    if (!existing || now - existing.firstSeen > windowMs) {
      entries.set(route, { route, count: 1, firstSeen: now, lastSeen: now });
      return;
    }

    existing.count += 1;
    existing.lastSeen = now;

    if (existing.count === threshold && onThresholdReached) {
      onThresholdReached({ ...existing });
    }
  }

  function getEntry(route: string): RetryEntry | undefined {
    return entries.get(route);
  }

  function reset(route?: string): void {
    if (route) {
      entries.delete(route);
    } else {
      entries.clear();
    }
  }

  return { record, getEntry, reset };
}
