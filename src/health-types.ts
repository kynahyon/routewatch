/**
 * Shared types for the health reporting feature.
 * Imported by health.ts, health-endpoint.ts, and consumers.
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface RouteHealth {
  /** Aggregated health status for the route */
  status: HealthStatus;
  /** 95th-percentile response time in milliseconds */
  p95: number;
  /** Fraction of requests that resulted in errors (0–1) */
  errorRate: number;
  /** Current circuit-breaker state: 'closed' | 'open' | 'half-open' */
  circuitState: string;
}

export interface HealthRouteSummary {
  total: number;
  degraded: number;
  tripped: number;
}

export interface HealthReport {
  /** Overall system health derived from all monitored routes */
  status: HealthStatus;
  /** ISO-8601 timestamp of report generation */
  timestamp: string;
  /** Seconds since the process started */
  uptime: number;
  routes: HealthRouteSummary;
  /** Per-route breakdown */
  details: Record<string, RouteHealth>;
}

export interface HealthEndpointOptions {
  /** Express path to mount the health endpoint (default: '/health') */
  path?: string;
  /** Response time in ms above which a route is considered degraded (default: 1000) */
  slowThreshold?: number;
  /** Error fraction above which a route is considered degraded (default: 0.1) */
  errorRateThreshold?: number;
  /** Callback to supply the list of route keys to evaluate */
  getRoutes?: () => string[];
}
