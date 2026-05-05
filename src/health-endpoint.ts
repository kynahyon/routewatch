import { Router, Request, Response } from 'express';
import { generateHealthReport } from './health';
import { getRouteStats } from './reporter';

export interface HealthEndpointOptions {
  path?: string;
  slowThreshold?: number;
  errorRateThreshold?: number;
  getRoutes?: () => string[];
}

function defaultGetRoutes(): string[] {
  // Dynamically derive known routes from reporter stats keys
  try {
    // reporter exposes a way to list routes via generateReport
    const { generateReport } = require('./reporter') as typeof import('./reporter');
    const report = generateReport();
    return Object.keys(report);
  } catch {
    return [];
  }
}

export function createHealthRouter(options: HealthEndpointOptions = {}): Router {
  const {
    path = '/health',
    slowThreshold = 1000,
    errorRateThreshold = 0.1,
    getRoutes = defaultGetRoutes,
  } = options;

  const router = Router();

  router.get(path, (_req: Request, res: Response) => {
    const routes = getRoutes();
    const report = generateHealthReport(routes, slowThreshold, errorRateThreshold);

    const statusCode =
      report.status === 'healthy' ? 200 : report.status === 'degraded' ? 207 : 503;

    res.status(statusCode).json(report);
  });

  return router;
}
