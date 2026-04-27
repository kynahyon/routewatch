import { Request, Response, NextFunction } from 'express';
import { createCircuitBreaker, CircuitBreakerOptions, CircuitState } from './circuit-breaker';
import { createLogger } from './logger';

export interface CircuitBreakerMiddlewareOptions extends Partial<CircuitBreakerOptions> {
  onOpen?: (route: string, state: CircuitState) => void;
  logger?: ReturnType<typeof createLogger>;
}

/**
 * Express middleware that tracks slow routes and emits warnings when a
 * circuit transitions to 'open' or 'half-open' state.
 */
export function createCircuitBreakerMiddleware(opts: CircuitBreakerMiddlewareOptions = {}) {
  const { onOpen, logger: externalLogger, ...cbOpts } = opts;
  const cb = createCircuitBreaker(cbOpts);
  const logger = externalLogger ?? createLogger({ prefix: '[routewatch:circuit]' });

  return function circuitBreakerMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const start = Date.now();
    const route = req.route?.path ?? req.path ?? 'unknown';

    res.on('finish', () => {
      const duration = Date.now() - start;
      const prevState = cb.getState(route);
      const newState = cb.record(route, duration);

      if (newState === 'open' && prevState !== 'open') {
        logger.warn(`Circuit opened for route ${route} after ${duration}ms`);
        onOpen?.(route, newState);
      } else if (newState === 'half-open') {
        logger.warn(`Circuit half-open for route ${route}, testing recovery`);
      }
    });

    next();
  };
}
