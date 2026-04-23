import {
  recordRequest,
  getRouteStats,
  generateReport,
  resetRecords,
} from './reporter';

beforeEach(() => {
  resetRecords();
});

describe('recordRequest', () => {
  it('should record a new route entry', () => {
    recordRequest('GET', '/api/users', 120, false);
    const stats = getRouteStats();
    expect(stats).toHaveLength(1);
    expect(stats[0].route).toBe('/api/users');
    expect(stats[0].method).toBe('GET');
    expect(stats[0].totalRequests).toBe(1);
    expect(stats[0].slowRequests).toBe(0);
  });

  it('should accumulate multiple requests for the same route', () => {
    recordRequest('GET', '/api/users', 100, false);
    recordRequest('GET', '/api/users', 200, true);
    recordRequest('GET', '/api/users', 150, false);
    const stats = getRouteStats();
    expect(stats[0].totalRequests).toBe(3);
    expect(stats[0].slowRequests).toBe(1);
  });

  it('should treat different methods as separate routes', () => {
    recordRequest('GET', '/api/users', 100, false);
    recordRequest('POST', '/api/users', 200, false);
    const stats = getRouteStats();
    expect(stats).toHaveLength(2);
  });
});

describe('getRouteStats', () => {
  it('should calculate correct average duration', () => {
    recordRequest('GET', '/api/test', 100, false);
    recordRequest('GET', '/api/test', 300, false);
    const stats = getRouteStats();
    expect(stats[0].avgDurationMs).toBe(200);
  });

  it('should calculate max duration correctly', () => {
    recordRequest('GET', '/api/test', 50, false);
    recordRequest('GET', '/api/test', 500, true);
    recordRequest('GET', '/api/test', 200, false);
    const stats = getRouteStats();
    expect(stats[0].maxDurationMs).toBe(500);
  });
});

describe('generateReport', () => {
  it('should return a report with metadata', () => {
    recordRequest('GET', '/api/users', 300, true);
    const report = generateReport();
    expect(report.generatedAt).toBeDefined();
    expect(report.totalRoutes).toBe(1);
    expect(report.routes).toHaveLength(1);
  });

  it('should respect topN limit', () => {
    for (let i = 0; i < 15; i++) {
      recordRequest('GET', `/api/route${i}`, 100 + i * 10, false);
    }
    const report = generateReport({ topN: 5 });
    expect(report.routes).toHaveLength(5);
  });

  it('should filter by minRequests', () => {
    recordRequest('GET', '/api/rare', 500, false);
    recordRequest('GET', '/api/common', 100, false);
    recordRequest('GET', '/api/common', 120, false);
    const report = generateReport({ minRequests: 2 });
    expect(report.routes).toHaveLength(1);
    expect(report.routes[0].route).toBe('/api/common');
  });

  it('should sort routes by average duration descending', () => {
    recordRequest('GET', '/api/fast', 50, false);
    recordRequest('GET', '/api/slow', 800, true);
    const report = generateReport();
    expect(report.routes[0].route).toBe('/api/slow');
  });
});
