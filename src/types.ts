/**
 * types.ts
 * Shared type definitions for routewatch.
 */

export interface RouteWatchOptions {
  /** Global slow-request threshold in milliseconds (default: 1000) */
  threshold?: number;
  /** Per-route threshold overrides */
  routeThresholds?: Record<string, number>;
  /** Sampling configuration */
  sampling?: {
    rate: number;
    routeOverrides?: Record<string, number>;
  };
  /** Custom alert handlers */
  alertHandlers?: AlertHandler[];
  /** Logger instance or false to disable logging */
  logger?: RouteWatchLogger | false;
}

export interface RouteWatchLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface RequestMeta {
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: Date;
}

export type AlertHandler = (meta: RequestMeta) => void | Promise<void>;

export interface ThresholdConfig {
  default: number;
  routes: Record<string, number>;
}
