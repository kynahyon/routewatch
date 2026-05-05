/**
 * Express middleware that evaluates route performance budgets after each request
 * and emits violations via the alert system.
 */

import { Request, Response, NextFunction } from 'express';
import { createBudgetTracker, BudgetTrackerOptions } from './budget-tracker';
import { RouteMetrics } from './budget';
import { getRouteStats } from './reporter';
import { normalizeRoutePath } from './filter';

export type BudgetViolationHandler = (
  route: string,
  violations: ReturnType<ReturnType<typeof createBudgetTracker>['evaluate']>
) => void;

export interface BudgetMiddlewareOptions extends BudgetTrackerOptions {
  onViolation?: BudgetViolationHandler;
}

const defaultHandler: BudgetViolationHandler = (route, violations) => {
  for (const v of violations) {
    console.warn(
      `[routewatch] Budget exceeded on ${route}: ${v.metric} is ${v.actual} (budget: ${v.budget})`
    );
  }
};

let sharedTracker: ReturnType<typeof createBudgetTracker> | null = null;

export function getBudgetTracker(options?: BudgetMiddlewareOptions) {
  if (!sharedTracker) sharedTracker = createBudgetTracker(options ?? {});
  return sharedTracker;
}

export function resetBudgetTracker() {
  sharedTracker = null;
}

export function createBudgetMiddleware(options: BudgetMiddlewareOptions = {}) {
  const { onViolation = defaultHandler, ...trackerOptions } = options;
  const tracker = getBudgetTracker(trackerOptions);

  return function budgetMiddleware(req: Request, res: Response, next: NextFunction) {
    res.on('finish', () => {
      const route = normalizeRoutePath(req.route?.path ?? req.path);
      const stats = getRouteStats(route);
      if (!stats || stats.count < 5) return;

      const metrics: RouteMetrics = {
        p50: stats.p50,
        p95: stats.p95,
        p99: stats.p99,
        errorRate: stats.errorRate,
      };

      const violations = tracker.evaluate(route, metrics);
      if (violations.length > 0) onViolation(route, violations);
    });

    next();
  };
}
