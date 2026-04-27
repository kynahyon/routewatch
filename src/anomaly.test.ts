import {
  computeMean,
  computeStdDev,
  computeZScore,
  detectAnomaly,
  detectAnomalies,
} from './anomaly';
import { RouteStats } from './types';

describe('computeMean', () => {
  it('returns 0 for empty array', () => {
    expect(computeMean([])).toBe(0);
  });

  it('computes correct mean', () => {
    expect(computeMean([100, 200, 300])).toBe(200);
  });
});

describe('computeStdDev', () => {
  it('returns 0 for fewer than 2 values', () => {
    expect(computeStdDev([100], 100)).toBe(0);
  });

  it('computes correct standard deviation', () => {
    const values = [100, 200, 300];
    const mean = computeMean(values);
    const stdDev = computeStdDev(values, mean);
    expect(stdDev).toBeCloseTo(100, 0);
  });
});

describe('computeZScore', () => {
  it('returns 0 when stdDev is 0', () => {
    expect(computeZScore(200, 200, 0)).toBe(0);
  });

  it('computes positive z-score for above-mean value', () => {
    expect(computeZScore(300, 200, 100)).toBeCloseTo(1, 5);
  });

  it('computes negative z-score for below-mean value', () => {
    expect(computeZScore(100, 200, 100)).toBeCloseTo(-1, 5);
  });
});

describe('detectAnomaly', () => {
  const history = [100, 110, 105, 108, 102, 107];

  it('flags anomaly when z-score exceeds threshold', () => {
    const result = detectAnomaly('/api/test', history, 500, { zScoreThreshold: 2.5 });
    expect(result.isAnomaly).toBe(true);
    expect(result.route).toBe('/api/test');
  });

  it('does not flag anomaly for normal value', () => {
    const result = detectAnomaly('/api/test', history, 106, { zScoreThreshold: 2.5 });
    expect(result.isAnomaly).toBe(false);
  });

  it('does not flag anomaly when below minSamples', () => {
    const result = detectAnomaly('/api/test', [100, 200], 999, { minSamples: 5 });
    expect(result.isAnomaly).toBe(false);
  });
});

describe('detectAnomalies', () => {
  it('returns results for all routes', () => {
    const statsMap = new Map<string, RouteStats>([
      ['/api/a', { count: 10, mean: 105, p95: 500, p99: 600, errors: 0 }],
      ['/api/b', { count: 10, mean: 200, p95: 210, p99: 250, errors: 0 }],
    ]);
    const p95History = new Map<string, number[]>([
      ['/api/a', [100, 110, 105, 108, 102, 107]],
      ['/api/b', [200, 205, 198, 202, 201, 203]],
    ]);

    const results = detectAnomalies(statsMap, p95History, { zScoreThreshold: 2.5 });
    expect(results).toHaveLength(2);

    const anomalousRoute = results.find((r) => r.route === '/api/a');
    expect(anomalousRoute?.isAnomaly).toBe(true);

    const normalRoute = results.find((r) => r.route === '/api/b');
    expect(normalRoute?.isAnomaly).toBe(false);
  });
});
