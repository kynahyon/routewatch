import { Request, Response, NextFunction } from 'express';
import { createTimer } from './timer';
import { createLogger } from './logger';
import { resolveThresholds, evaluateThreshold } from './threshold';
import { createDefaultAlertHandlers } from './alert';
import type { RouteWatchOptions } from './types';

export function createExpressMiddleware(options: RouteWatchOptions = {}) {
  const logger = createLogger(options.logger);
  const thresholds = resolveThresholds(options.thresholds);
  const alertHandlers = options.alertHandlers ?? createDefaultAlertHandlers(logger);

  return function routeWatchMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const timer = createTimer();
    const route = req.path;
    const method = req.method;

    res.on('finish', () => {
      const duration = timer.elapsed();
      const status = res.statusCode;

      const evaluation = evaluateThreshold(duration, route, thresholds);

      logger.log({
        method,
        route,
        status,
        duration,
        slow: evaluation.isSlow,
        level: evaluation.level,
      });

      if (evaluation.isSlow) {
        alertHandlers.forEach((handler) =>
          handler({ method, route, status, duration, level: evaluation.level })
        );
      }
    });

    next();
  };
}
