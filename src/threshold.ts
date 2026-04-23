export interface ThresholdConfig {
  warnMs: number;
  criticalMs: number;
  routes?: Record<string, { warnMs: number; criticalMs: number }>;
}

export type ThresholdLevel = 'ok' | 'warn' | 'critical';

export interface ThresholdResult {
  level: ThresholdLevel;
  durationMs: number;
  warnMs: number;
  criticalMs: number;
}

export const DEFAULT_THRESHOLD_CONFIG: ThresholdConfig = {
  warnMs: 500,
  criticalMs: 2000,
};

export function resolveThresholds(
  config: ThresholdConfig,
  route: string
): { warnMs: number; criticalMs: number } {
  const routeOverride = config.routes?.[route];
  return {
    warnMs: routeOverride?.warnMs ?? config.warnMs,
    criticalMs: routeOverride?.criticalMs ?? config.criticalMs,
  };
}

export function evaluateThreshold(
  durationMs: number,
  config: ThresholdConfig,
  route: string
): ThresholdResult {
  const { warnMs, criticalMs } = resolveThresholds(config, route);

  let level: ThresholdLevel = 'ok';
  if (durationMs >= criticalMs) {
    level = 'critical';
  } else if (durationMs >= warnMs) {
    level = 'warn';
  }

  return { level, durationMs, warnMs, criticalMs };
}

export function mergeThresholdConfig(
  defaults: ThresholdConfig,
  overrides: Partial<ThresholdConfig>
): ThresholdConfig {
  return {
    ...defaults,
    ...overrides,
    routes: {
      ...defaults.routes,
      ...overrides.routes,
    },
  };
}
