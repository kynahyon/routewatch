import { RouteStats, ReporterConfig, SlowRouteReport } from './types';

export interface RouteRecord {
  route: string;
  method: string;
  durations: number[];
  slowCount: number;
  totalCount: number;
}

const records = new Map<string, RouteRecord>();

export function recordRequest(
  method: string,
  route: string,
  durationMs: number,
  isSlow: boolean
): void {
  const key = `${method.toUpperCase()}:${route}`;
  const existing = records.get(key);

  if (existing) {
    existing.durations.push(durationMs);
    existing.totalCount += 1;
    if (isSlow) existing.slowCount += 1;
  } else {
    records.set(key, {
      route,
      method: method.toUpperCase(),
      durations: [durationMs],
      slowCount: isSlow ? 1 : 0,
      totalCount: 1,
    });
  }
}

export function getRouteStats(): RouteStats[] {
  return Array.from(records.values()).map((record) => {
    const sorted = [...record.durations].sort((a, b) => a - b);
    const avg =
      record.durations.reduce((sum, d) => sum + d, 0) / record.durations.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      route: record.route,
      method: record.method,
      totalRequests: record.totalCount,
      slowRequests: record.slowCount,
      avgDurationMs: Math.round(avg),
      p95DurationMs: sorted[p95Index] ?? sorted[sorted.length - 1],
      p99DurationMs: sorted[p99Index] ?? sorted[sorted.length - 1],
      maxDurationMs: sorted[sorted.length - 1],
    };
  });
}

export function generateReport(config: ReporterConfig = {}): SlowRouteReport {
  const { topN = 10, minRequests = 1 } = config;
  const stats = getRouteStats().filter((s) => s.totalRequests >= minRequests);
  const sorted = stats.sort((a, b) => b.avgDurationMs - a.avgDurationMs);

  return {
    generatedAt: new Date().toISOString(),
    totalRoutes: stats.length,
    routes: sorted.slice(0, topN),
  };
}

export function resetRecords(): void {
  records.clear();
}
