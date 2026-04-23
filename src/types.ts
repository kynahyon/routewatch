export interface TimerResult {
  startTime: number;
  getDuration: () => number;
}

export interface ThresholdConfig {
  warnMs?: number;
  criticalMs?: number;
  routes?: Record<string, { warnMs?: number; criticalMs?: number }>;
}

export interface LogEntry {
  timestamp: string;
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
  level: 'info' | 'warn' | 'error';
  message?: string;
}

export interface AlertPayload {
  route: string;
  method: string;
  durationMs: number;
  threshold: number;
  severity: 'warn' | 'critical';
}

export interface RouteStats {
  route: string;
  method: string;
  totalRequests: number;
  slowRequests: number;
  avgDurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  maxDurationMs: number;
}

export interface SlowRouteReport {
  generatedAt: string;
  totalRoutes: number;
  routes: RouteStats[];
}

export interface ReporterConfig {
  topN?: number;
  minRequests?: number;
}

export interface RouteWatchOptions {
  thresholds?: ThresholdConfig;
  sampleRate?: number;
  onAlert?: (payload: AlertPayload) => void;
  reporter?: ReporterConfig;
}
