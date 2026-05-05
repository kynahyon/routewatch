import express from 'express';
import request from 'supertest';
import { createHealthRouter } from './health-endpoint';
import * as health from './health';

jest.mock('./health');

const mockGenerateHealthReport = health.generateHealthReport as jest.Mock;

function buildApp(options = {}) {
  const app = express();
  app.use(createHealthRouter(options));
  return app;
}

describe('createHealthRouter', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 for healthy status', async () => {
    mockGenerateHealthReport.mockReturnValue({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 100,
      routes: { total: 2, degraded: 0, tripped: 0 },
      details: {},
    });

    const res = await request(buildApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('returns 207 for degraded status', async () => {
    mockGenerateHealthReport.mockReturnValue({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: 200,
      routes: { total: 3, degraded: 1, tripped: 0 },
      details: {},
    });

    const res = await request(buildApp()).get('/health');
    expect(res.status).toBe(207);
    expect(res.body.status).toBe('degraded');
  });

  it('returns 503 for unhealthy status', async () => {
    mockGenerateHealthReport.mockReturnValue({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: 50,
      routes: { total: 1, degraded: 0, tripped: 1 },
      details: {},
    });

    const res = await request(buildApp()).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
  });

  it('uses custom path when provided', async () => {
    mockGenerateHealthReport.mockReturnValue({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 10,
      routes: { total: 0, degraded: 0, tripped: 0 },
      details: {},
    });

    const res = await request(buildApp({ path: '/status' })).get('/status');
    expect(res.status).toBe(200);
  });

  it('passes slowThreshold and errorRateThreshold to generateHealthReport', async () => {
    mockGenerateHealthReport.mockReturnValue({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 10,
      routes: { total: 0, degraded: 0, tripped: 0 },
      details: {},
    });

    const getRoutes = () => ['/api/test'];
    await request(buildApp({ slowThreshold: 500, errorRateThreshold: 0.05, getRoutes })).get('/health');

    expect(mockGenerateHealthReport).toHaveBeenCalledWith(
      ['/api/test'],
      500,
      0.05
    );
  });

  it('returns 404 for unknown paths', async () => {
    mockGenerateHealthReport.mockReturnValue({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 10,
      routes: { total: 0, degraded: 0, tripped: 0 },
      details: {},
    });

    const res = await request(buildApp()).get('/not-health');
    expect(res.status).toBe(404);
  });
});
