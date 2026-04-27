import { Request, Response, NextFunction } from 'express';
import { createAnomalyTracker, AnomalyTrackerOptions, AnomalyTracker } from './anomaly-tracker';
import { getRouteStats } from './reporter';
import { createLogger } from './logger';
import { RouteWatchOptions } from './types';

export interface AnomalyMiddlewareOptions extends AnomalyTrackerOptions {
  onAnomaly?: (route: string, zScore: number, p95: number) => void;
  logLevel?: RouteWatchOptions['logLevel'];
}

let sharedTracker: AnomalyTracker | null = null;

export function getAnomalyTracker(options: AnomalyTrackerOptions = {}): AnomalyTracker {
  if (!sharedTracker) {
    sharedTracker = createAnomalyTracker(options);
  }
  return sharedTracker;
}

export function resetAnomalyTracker(): void {
  sharedTracker = null;
}

export function createAnomalyMiddleware(options: AnomalyMiddlewareOptions = {}) {
  const tracker = createAnomalyTracker(options);
  const logger = createLogger({ logLevel: options.logLevel ?? 'warn' });

  return function anomalyMiddleware(
    _req: Request,
    _res: Response,
    next: NextFunction
  ): void {
    const statsMap = getRouteStats();

    for (const [route, stats] of statsMap.entries()) {
      tracker.record(route, stats.p95);
    }

    const results = tracker.analyze(statsMap);

    for (const result of results) {
      if (result.isAnomaly) {
        logger.warn(
          `[routewatch] Anomaly detected on ${result.route}: ` +
            `p95=${result.latestP95}ms z=${result.zScore.toFixed(2)} ` +
            `mean=${result.mean.toFixed(1)}ms`
        );
        options.onAnomaly?.(result.route, result.zScore, result.latestP95);
      }
    }

    next();
  };
}
