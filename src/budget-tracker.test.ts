import { createBudgetTracker } from './budget-tracker';
import { RouteMetrics } from './budget';

const okMetrics: RouteMetrics = { p50: 50, p95: 150, p99: 300, errorRate: 0.01 };
const slowMetrics: RouteMetrics = { p50: 200, p95: 500, p99: 900, errorRate: 0.1 };

describe('createBudgetTracker', () => {
  it('returns no violations when metrics are within budget', () => {
    const tracker = createBudgetTracker({ globalBudget: { p95: 300 } });
    const violations = tracker.evaluate('/api/users', okMetrics);
    expect(violations).toHaveLength(0);
  });

  it('records violations when metrics exceed budget', () => {
    const tracker = createBudgetTracker({ globalBudget: { p95: 300 } });
    const violations = tracker.evaluate('/api/users', slowMetrics);
    expect(violations).toHaveLength(1);
    expect(violations[0].metric).toBe('p95');
  });

  it('applies route-level budget override', () => {
    const tracker = createBudgetTracker({
      globalBudget: { p95: 200 },
      routeBudgets: { '/api/reports': { p95: 1000 } },
    });
    const violations = tracker.evaluate('/api/reports', slowMetrics);
    expect(violations).toHaveLength(0);
  });

  it('getViolations returns all violations for a route', () => {
    const tracker = createBudgetTracker({ globalBudget: { p95: 200 } });
    tracker.evaluate('/api/users', slowMetrics);
    tracker.evaluate('/api/users', slowMetrics);
    expect(tracker.getViolations('/api/users')).toHaveLength(2);
  });

  it('getViolations returns all violations across routes when no route specified', () => {
    const tracker = createBudgetTracker({ globalBudget: { p95: 200 } });
    tracker.evaluate('/api/users', slowMetrics);
    tracker.evaluate('/api/orders', slowMetrics);
    expect(tracker.getViolations().length).toBeGreaterThanOrEqual(2);
  });

  it('respects maxHistory limit', () => {
    const tracker = createBudgetTracker({ globalBudget: { p95: 200 }, maxHistory: 3 });
    for (let i = 0; i < 5; i++) tracker.evaluate('/api/users', slowMetrics);
    expect(tracker.getViolations('/api/users')).toHaveLength(3);
  });

  it('reset clears violations for a specific route', () => {
    const tracker = createBudgetTracker({ globalBudget: { p95: 200 } });
    tracker.evaluate('/api/users', slowMetrics);
    tracker.reset('/api/users');
    expect(tracker.getViolations('/api/users')).toHaveLength(0);
  });

  it('reset clears all violations when no route given', () => {
    const tracker = createBudgetTracker({ globalBudget: { p95: 200 } });
    tracker.evaluate('/api/users', slowMetrics);
    tracker.evaluate('/api/orders', slowMetrics);
    tracker.reset();
    expect(tracker.getViolations()).toHaveLength(0);
  });
});
