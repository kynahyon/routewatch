/**
 * rate-limiter.ts
 *
 * Tracks request rates per route and emits alerts when a route
 * exceeds a configured requests-per-second (or per-minute) threshold.
 * Integrates with the alert and logger systems.
 */

import { createLogger } from './logger';
import { RouteWatchAlert, RouteWatchOptions } from './types';

const logger = createLogger({ prefix: '[routewatch:rate-limiter]' });

export interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds (default: 60000 = 1 minute) */
  windowMs: number;
  /** Optional per-route overrides keyed by route pattern */
  routeOverrides?: Record<string, { maxRequests: number; windowMs?: number }>;
}

export interface RateLimitEntry {
  count: number;
  windowStart: number;
  alerted: boolean;
}

export interface RateLimiter {
  record: (route: string, method: string) => RateLimitResult;
  reset: (route?: string) => void;
  getEntry: (key: string) => RateLimitEntry | undefined;
}

export interface RateLimitResult {
  route: string;
  method: string;
  count: number;
  limit: number;
  windowMs: number;
  exceeded: boolean;
}

/**
 * Creates a rate limiter that tracks request counts per route within
 * a sliding window and flags routes that exceed the configured limit.
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  const { maxRequests, windowMs = 60_000, routeOverrides = {} } = config;
  const entries = new Map<string, RateLimitEntry>();

  function resolveLimit(route: string): { maxRequests: number; windowMs: number } {
    const override = routeOverrides[route];
    if (override) {
      return {
        maxRequests: override.maxRequests,
        windowMs: override.windowMs ?? windowMs,
      };
    }
    return { maxRequests, windowMs };
  }

  function record(route: string, method: string): RateLimitResult {
    const key = `${method.toUpperCase()}:${route}`;
    const now = Date.now();
    const { maxRequests: limit, windowMs: window } = resolveLimit(route);

    let entry = entries.get(key);

    if (!entry || now - entry.windowStart >= window) {
      // Start a new window
      entry = { count: 1, windowStart: now, alerted: false };
      entries.set(key, entry);
    } else {
      entry.count += 1;
    }

    const exceeded = entry.count > limit;

    if (exceeded && !entry.alerted) {
      entry.alerted = true;
      logger.warn(
        `Rate limit exceeded for ${method.toUpperCase()} ${route}: ` +
          `${entry.count} requests in ${window}ms (limit: ${limit})`
      );
    }

    return {
      route,
      method: method.toUpperCase(),
      count: entry.count,
      limit,
      windowMs: window,
      exceeded,
    };
  }

  function reset(route?: string): void {
    if (!route) {
      entries.clear();
      return;
    }
    // Remove all entries matching the given route (any method)
    for (const key of entries.keys()) {
      if (key.endsWith(`:${route}`)) {
        entries.delete(key);
      }
    }
  }

  function getEntry(key: string): RateLimitEntry | undefined {
    return entries.get(key);
  }

  return { record, reset, getEntry };
}
