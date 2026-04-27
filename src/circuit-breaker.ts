import { RouteWatchOptions } from './types';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerEntry {
  state: CircuitState;
  failures: number;
  lastFailureAt: number | null;
  openedAt: number | null;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;   // number of slow requests before opening
  recoveryWindowMs: number;   // time before attempting half-open
  slowThresholdMs: number;    // ms above which a request counts as a failure
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  recoveryWindowMs: 30_000,
  slowThresholdMs: 2_000,
};

const store = new Map<string, CircuitBreakerEntry>();

export function createCircuitBreaker(opts: Partial<CircuitBreakerOptions> = {}) {
  const options: CircuitBreakerOptions = { ...DEFAULT_OPTIONS, ...opts };

  function getEntry(route: string): CircuitBreakerEntry {
    if (!store.has(route)) {
      store.set(route, { state: 'closed', failures: 0, lastFailureAt: null, openedAt: null });
    }
    return store.get(route)!;
  }

  function record(route: string, durationMs: number): CircuitState {
    const entry = getEntry(route);
    const now = Date.now();

    if (entry.state === 'open') {
      if (now - (entry.openedAt ?? 0) >= options.recoveryWindowMs) {
        entry.state = 'half-open';
      } else {
        return entry.state;
      }
    }

    if (durationMs >= options.slowThresholdMs) {
      entry.failures += 1;
      entry.lastFailureAt = now;
      if (entry.failures >= options.failureThreshold) {
        entry.state = 'open';
        entry.openedAt = now;
      }
    } else if (entry.state === 'half-open') {
      entry.state = 'closed';
      entry.failures = 0;
      entry.openedAt = null;
    }

    return entry.state;
  }

  function getState(route: string): CircuitState {
    return getEntry(route).state;
  }

  function reset(route?: string) {
    if (route) {
      store.delete(route);
    } else {
      store.clear();
    }
  }

  return { record, getState, getEntry, reset, options };
}
