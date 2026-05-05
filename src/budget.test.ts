import { checkBudget, mergeBudgetConfig, RouteMetrics, BudgetConfig } from './budget';

const baseMetrics: RouteMetrics = {
  p50: 80,
  p95: 200,
  p99: 400,
  errorRate: 0.01,
};

describe('checkBudget', () => {
  it('returns withinBudget=true when all metrics are under budget', () => {
    const budget: BudgetConfig = { p50: 100, p95: 300, p99: 500, errorRate: 0.05 };
    const result = checkBudget('/api/users', baseMetrics, budget);
    expect(result.withinBudget).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('reports a violation when p95 exceeds budget', () => {
    const budget: BudgetConfig = { p95: 150 };
    const result = checkBudget('/api/users', baseMetrics, budget);
    expect(result.withinBudget).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].metric).toBe('p95');
    expect(result.violations[0].actual).toBe(200);
    expect(result.violations[0].budget).toBe(150);
    expect(result.violations[0].exceededBy).toBe(50);
  });

  it('reports multiple violations', () => {
    const budget: BudgetConfig = { p50: 50, p99: 300, errorRate: 0.005 };
    const result = checkBudget('/api/orders', baseMetrics, budget);
    expect(result.withinBudget).toBe(false);
    expect(result.violations).toHaveLength(3);
  });

  it('ignores metrics not present in budget', () => {
    const result = checkBudget('/api/health', baseMetrics, {});
    expect(result.withinBudget).toBe(true);
  });

  it('includes route and timestamp in violation', () => {
    const before = Date.now();
    const result = checkBudget('/api/slow', baseMetrics, { p50: 10 });
    expect(result.violations[0].route).toBe('/api/slow');
    expect(result.violations[0].timestamp).toBeGreaterThanOrEqual(before);
  });
});

describe('mergeBudgetConfig', () => {
  it('merges global and route-level config', () => {
    const global: BudgetConfig = { p50: 100, p95: 300 };
    const route: Partial<BudgetConfig> = { p95: 200 };
    const merged = mergeBudgetConfig(global, route);
    expect(merged.p50).toBe(100);
    expect(merged.p95).toBe(200);
  });

  it('returns global config when no route override provided', () => {
    const global: BudgetConfig = { p50: 100 };
    expect(mergeBudgetConfig(global)).toEqual({ p50: 100 });
  });
});
