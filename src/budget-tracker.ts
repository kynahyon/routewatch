/**
 * Tracks per-route budget violations over time and exposes summary data.
 */

import { BudgetConfig, BudgetViolation, checkBudget, mergeBudgetConfig, RouteMetrics } from './budget';

export interface BudgetTrackerOptions {
  globalBudget?: BudgetConfig;
  routeBudgets?: Record<string, Partial<BudgetConfig>>;
  /** Max violations to retain per route */
  maxHistory?: number;
}

export interface BudgetTracker {
  evaluate(route: string, metrics: RouteMetrics): BudgetViolation[];
  getViolations(route?: string): BudgetViolation[];
  reset(route?: string): void;
}

export function createBudgetTracker(options: BudgetTrackerOptions = {}): BudgetTracker {
  const { globalBudget = {}, routeBudgets = {}, maxHistory = 100 } = options;
  const history: Map<string, BudgetViolation[]> = new Map();

  function evaluate(route: string, metrics: RouteMetrics): BudgetViolation[] {
    const routeOverride = routeBudgets[route];
    const budget = mergeBudgetConfig(globalBudget, routeOverride);
    const { violations } = checkBudget(route, metrics, budget);

    if (violations.length > 0) {
      const existing = history.get(route) ?? [];
      const updated = [...existing, ...violations].slice(-maxHistory);
      history.set(route, updated);
    }

    return violations;
  }

  function getViolations(route?: string): BudgetViolation[] {
    if (route) return history.get(route) ?? [];
    const all: BudgetViolation[] = [];
    for (const v of history.values()) all.push(...v);
    return all;
  }

  function reset(route?: string): void {
    if (route) history.delete(route);
    else history.clear();
  }

  return { evaluate, getViolations, reset };
}
