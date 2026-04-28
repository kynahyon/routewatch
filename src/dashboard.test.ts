import express, { type Express } from 'express';
import request from 'supertest';
import { createDashboardRouter } from './dashboard';
import * as reporter from './reporter';
import * as anomalyMiddleware from './anomaly-middleware';
import { createAnomalyTracker } from './anomaly-tracker';

jest.mock('./reporter');
jest.mock('./anomaly-middleware');

const mockReport = {
  routes: {
    'GET /api/users': { count: 10, avgDuration: 120, p95Duration: 200 },
  },
  generatedAt: new Date().toISOString(),
};

const mockTracker = createAnomalyTracker();

beforeEach(() => {
  jest.resetAllMocks();
  (reporter.generateReport as jest.Mock).mockReturnValue(mockReport);
  (anomalyMiddleware.getAnomalyTracker as jest.Mock).mockReturnValue(mockTracker);
});

function buildApp(options = {}): Express {
  const app = express();
  app.use(createDashboardRouter(options));
  return app;
}

describe('createDashboardRouter', () => {
  it('serves HTML on the default dashboard path', async () => {
    const res = await request(buildApp()).get('/__routewatch/dashboard');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('RouteWatch Dashboard');
    expect(res.text).toContain('GET /api/users');
  });

  it('serves JSON on the /json sub-path', async () => {
    const res = await request(buildApp()).get('/__routewatch/dashboard/json');
    expect(res.status).toBe(200);
    expect(res.body.report).toEqual(mockReport);
    expect(res.body).toHaveProperty('anomalies');
  });

  it('respects custom path option', async () => {
    const app = buildApp({ path: '/status/dash' });
    const res = await request(app).get('/status/dash');
    expect(res.status).toBe(200);
    expect(res.text).toContain('RouteWatch Dashboard');
  });

  it('uses custom title option', async () => {
    const app = buildApp({ title: 'My API Monitor' });
    const res = await request(app).get('/__routewatch/dashboard');
    expect(res.text).toContain('My API Monitor');
  });

  it('omits anomalies when includeAnomalies is false', async () => {
    const app = buildApp({ includeAnomalies: false });
    const res = await request(app).get('/__routewatch/dashboard/json');
    expect(res.status).toBe(200);
    expect(res.body.anomalies).toBeNull();
    expect(anomalyMiddleware.getAnomalyTracker).not.toHaveBeenCalled();
  });

  it('returns 404 for unknown paths under the router', async () => {
    const res = await request(buildApp()).get('/__routewatch/unknown');
    expect(res.status).toBe(404);
  });
});
