import { computeRouteHealth, generateHealthReport } from './health';
import * as reporter from './reporter';
import * as circuitBreaker from './circuit-breaker';

jest.mock('./reporter');
jest.mock('./circuit-breaker');

const mockGetRouteStats = reporter.getRouteStats as jest.Mock;
const mockGetState = circuitBreaker.getState as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetState.mockReturnValue('closed');
});

describe('computeRouteHealth', () => {
  it('returns healthy when no stats exist', () => {
    mockGetRouteStats.mockReturnValue(null);
    const result = computeRouteHealth('/api/test');
    expect(result.status).toBe('healthy');
    expect(result.p95).toBe(0);
    expect(result.errorRate).toBe(0);
  });

  it('returns healthy for fast routes with low error rate', () => {
    mockGetRouteStats.mockReturnValue({ count: 100, errorCount: 2, avg: 150, p95: 300 });
    const result = computeRouteHealth('/api/fast');
    expect(result.status).toBe('healthy');
  });

  it('returns degraded when p95 exceeds threshold', () => {
    mockGetRouteStats.mockReturnValue({ count: 50, errorCount: 0, avg: 800, p95: 1500 });
    const result = computeRouteHealth('/api/slow', 1000);
    expect(result.status).toBe('degraded');
  });

  it('returns degraded when error rate exceeds threshold', () => {
    mockGetRouteStats.mockReturnValue({ count: 100, errorCount: 20, avg: 200, p95: 400 });
    const result = computeRouteHealth('/api/errors', 1000, 0.1);
    expect(result.status).toBe('degraded');
    expect(result.errorRate).toBeCloseTo(0.2);
  });

  it('returns unhealthy when circuit is open', () => {
    mockGetState.mockReturnValue('open');
    mockGetRouteStats.mockReturnValue({ count: 10, errorCount: 0, avg: 100, p95: 200 });
    const result = computeRouteHealth('/api/tripped');
    expect(result.status).toBe('unhealthy');
    expect(result.circuitState).toBe('open');
  });

  it('falls back to avg when p95 is missing', () => {
    mockGetRouteStats.mockReturnValue({ count: 10, errorCount: 0, avg: 1200, p95: undefined });
    const result = computeRouteHealth('/api/no-p95', 1000);
    expect(result.p95).toBe(1200);
    expect(result.status).toBe('degraded');
  });
});

describe('generateHealthReport', () => {
  it('returns healthy when all routes are fine', () => {
    mockGetRouteStats.mockReturnValue({ count: 10, errorCount: 0, avg: 100, p95: 200 });
    const report = generateHealthReport(['/a', '/b']);
    expect(report.status).toBe('healthy');
    expect(report.routes.total).toBe(2);
    expect(report.routes.degraded).toBe(0);
  });

  it('returns degraded when some routes are degraded', () => {
    mockGetRouteStats.mockImplementation((route: string) =>
      route === '/slow'
        ? { count: 10, errorCount: 0, avg: 1500, p95: 2000 }
        : { count: 10, errorCount: 0, avg: 100, p95: 200 }
    );
    const report = generateHealthReport(['/slow', '/fast'], 1000);
    expect(report.status).toBe('degraded');
    expect(report.routes.degraded).toBe(1);
  });

  it('returns unhealthy when a circuit is open', () => {
    mockGetState.mockImplementation((route: string) =>
      route === '/broken' ? 'open' : 'closed'
    );
    mockGetRouteStats.mockReturnValue({ count: 5, errorCount: 0, avg: 100, p95: 200 });
    const report = generateHealthReport(['/broken', '/ok']);
    expect(report.status).toBe('unhealthy');
    expect(report.routes.tripped).toBe(1);
  });

  it('includes timestamp and uptime', () => {
    mockGetRouteStats.mockReturnValue(null);
    const report = generateHealthReport([]);
    expect(report.timestamp).toBeTruthy();
    expect(typeof report.uptime).toBe('number');
  });
});
