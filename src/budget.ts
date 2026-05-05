/**
 * Performance budget enforcement for routes.
 * Allows defining per-route or global latency budgets and tracking violations.
 */

export interface BudgetConfig {
  /** Maximum allowed p50 latency in ms */
  p50?: number;
  /** Maximum allowed p95 latency in ms */
  p95?: number;
  /** Maximum allowed p99 latency in ms */
  p99?: number;
  /** Maximum allowed error rate (0–1) */
  errorRate?: number;
}

export interface BudgetViolation {
  route: string;
  metric: keyof BudgetConfig;
  budget: number;
  actual: number;
  exceededBy: number;
  timestamp: number;
}

export interface BudgetResult {
  withinBudget: boolean;
  violations: BudgetViolation[];
}

export interface RouteMetrics {
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
}

export function checkBudget(
  route: string,
  metrics: RouteMetrics,
  budget: BudgetConfig
): BudgetResult {
  const violations: BudgetViolation[] = [];
  const keys: (keyof BudgetConfig)[] = ['p50', 'p95', 'p99', 'errorRate'];

  for (const metric of keys) {
    const limit = budget[metric];
    if (limit === undefined) continue;
    const actual = metrics[metric as keyof RouteMetrics];
    if (actual > limit) {
      violations.push({
        route,
        metric,
        budget: limit,
        actual,
        exceededBy: parseFloat((actual - limit).toFixed(3)),
        timestamp: Date.now(),
      });
    }
  }

  return { withinBudget: violations.length === 0, violations };
}

export function mergeBudgetConfig(
  global: BudgetConfig,
  route: Partial<BudgetConfig> = {}
): BudgetConfig {
  return { ...global, ...route };
}
