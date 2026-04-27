import { createAnomalyTracker } from './anomaly-tracker';
import { RouteStats } from './types';

function makeStats(p95: number): RouteStats {
  return { count: 10, mean: p95 * 0.8, p95, p99: p95 * 1.1, errors: 0 };
}

describe('createAnomalyTracker', () => {
  it('records p95 history per route', () => {
    const tracker = createAnomalyTracker();
    tracker.record('/api/users', 120);
    tracker.record('/api/users', 130);
    expect(tracker.getHistory('/api/users')).toEqual([120, 130]);
  });

  it('returns empty history for unknown route', () => {
    const tracker = createAnomalyTracker();
    expect(tracker.getHistory('/unknown')).toEqual([]);
  });

  it('caps history at maxHistoryLength', () => {
    const tracker = createAnomalyTracker({ maxHistoryLength: 3 });
    tracker.record('/api/x', 100);
    tracker.record('/api/x', 200);
    tracker.record('/api/x', 300);
    tracker.record('/api/x', 400);
    expect(tracker.getHistory('/api/x')).toEqual([200, 300, 400]);
  });

  it('returns a copy of history to prevent mutation', () => {
    const tracker = createAnomalyTracker();
    tracker.record('/api/y', 150);
    const history = tracker.getHistory('/api/y');
    history.push(999);
    expect(tracker.getHistory('/api/y')).toEqual([150]);
  });

  it('resets history for a specific route', () => {
    const tracker = createAnomalyTracker();
    tracker.record('/api/a', 100);
    tracker.record('/api/b', 200);
    tracker.reset('/api/a');
    expect(tracker.getHistory('/api/a')).toEqual([]);
    expect(tracker.getHistory('/api/b')).toEqual([200]);
  });

  it('resets all history when no route specified', () => {
    const tracker = createAnomalyTracker();
    tracker.record('/api/a', 100);
    tracker.record('/api/b', 200);
    tracker.reset();
    expect(tracker.getHistory('/api/a')).toEqual([]);
    expect(tracker.getHistory('/api/b')).toEqual([]);
  });

  it('detects anomalies via analyze', () => {
    const tracker = createAnomalyTracker({ zScoreThreshold: 2.0, minSamples: 5 });
    const route = '/api/slow';

    [100, 105, 102, 108, 103, 106].forEach((v) => tracker.record(route, v));

    const statsMap = new Map([[route, makeStats(500)]]);
    const results = tracker.analyze(statsMap);

    expect(results).toHaveLength(1);
    expect(results[0].isAnomaly).toBe(true);
    expect(results[0].route).toBe(route);
  });

  it('does not flag anomaly for normal p95', () => {
    const tracker = createAnomalyTracker({ zScoreThreshold: 2.5, minSamples: 5 });
    const route = '/api/normal';

    [100, 105, 102, 108, 103, 106].forEach((v) => tracker.record(route, v));

    const statsMap = new Map([[route, makeStats(104)]]);
    const results = tracker.analyze(statsMap);

    expect(results[0].isAnomaly).toBe(false);
  });
});
