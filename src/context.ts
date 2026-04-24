import { RouteWatchContext, RouteWatchOptions, AlertHandler, ThresholdConfig } from './types';
import { createLogger } from './logger';
import { createDefaultAlertHandlers } from './alert';
import { mergeThresholdConfig } from './threshold';
import { createSampler } from './sampler';
import { createRouteFilter } from './filter';

const DEFAULT_OPTIONS: Partial<RouteWatchOptions> = {
  slowThreshold: 500,
  sampleRate: 1.0,
  logLevel: 'warn',
  enabled: true,
};

export function createContext(options: RouteWatchOptions = {}): RouteWatchContext {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  const logger = merged.logger ?? createLogger({ level: merged.logLevel ?? 'warn' });

  const alertHandlers: AlertHandler[] = [
    ...createDefaultAlertHandlers({ logger }),
    ...(merged.alertHandlers ?? []),
  ];

  const thresholds = mergeThresholdConfig(
    { default: merged.slowThreshold ?? 500 },
    merged.thresholds ?? {}
  );

  const sampler = createSampler(merged.sampleRate ?? 1.0);

  const filter = createRouteFilter({
    include: merged.include,
    exclude: merged.exclude,
  });

  return {
    logger,
    alertHandlers,
    thresholds,
    sampler,
    filter,
    enabled: merged.enabled ?? true,
    options: merged,
  };
}

export function isContextEnabled(ctx: RouteWatchContext): boolean {
  return ctx.enabled === true;
}
