import { getRouteStats } from './reporter';
import { getState as getCircuitState } from './circuit-breaker';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthReport {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  routes: {
    total: number;
    degraded: number;
    tripped: number;
  };
  details: Record<string, RouteHealth>;
}

export interface RouteHealth {
  status: HealthStatus;
  p95: number;
  errorRate: number;
  circuitState: string;
}

const startTime = Date.now();

export function computeRouteHealth(
  route: string,
  slowThreshold = 1000,
  errorRateThreshold = 0.1
): RouteHealth {
  const stats = getRouteStats(route);
  const circuitState = getCircuitState(route);

  if (!stats) {
    return { status: 'healthy', p95: 0, errorRate: 0, circuitState };
  }

  const errorRate = stats.count > 0 ? stats.errorCount / stats.count : 0;
  const p95 = stats.p95 ?? stats.avg;

  let status: HealthStatus = 'healthy';
  if (circuitState === 'open') {
    status = 'unhealthy';
  } else if (p95 > slowThreshold || errorRate > errorRateThreshold) {
    status = 'degraded';
  }

  return { status, p95, errorRate, circuitState };
}

export function generateHealthReport(
  routes: string[],
  slowThreshold?: number,
  errorRateThreshold?: number
): HealthReport {
  const details: Record<string, RouteHealth> = {};
  let degraded = 0;
  let tripped = 0;

  for (const route of routes) {
    const health = computeRouteHealth(route, slowThreshold, errorRateThreshold);
    details[route] = health;
    if (health.status === 'degraded') degraded++;
    if (health.status === 'unhealthy') tripped++;
  }

  const overallStatus: HealthStatus =
    tripped > 0 ? 'unhealthy' : degraded > 0 ? 'degraded' : 'healthy';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    routes: { total: routes.length, degraded, tripped },
    details,
  };
}
