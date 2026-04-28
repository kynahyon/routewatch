import { generateReport } from './reporter';
import { getAnomalyTracker } from './anomaly-middleware';
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';

export interface DashboardOptions {
  path?: string;
  title?: string;
  includeAnomalies?: boolean;
}

const DEFAULT_OPTIONS: Required<DashboardOptions> = {
  path: '/__routewatch/dashboard',
  title: 'RouteWatch Dashboard',
  includeAnomalies: true,
};

function renderDashboard(title: string, report: object, anomalies: object | null): string {
  const data = JSON.stringify({ report, anomalies }, null, 2);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body { font-family: monospace; background: #0d1117; color: #c9d1d9; padding: 2rem; }
    h1 { color: #58a6ff; }
    pre { background: #161b22; padding: 1rem; border-radius: 6px; overflow: auto; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <pre id="data">${data}</pre>
</body>
</html>`;
}

export function createDashboardRouter(options: DashboardOptions = {}): Router {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const router = createRouter();

  router.get(opts.path, (_req: Request, res: Response) => {
    const report = generateReport();
    let anomalies: object | null = null;

    if (opts.includeAnomalies) {
      const tracker = getAnomalyTracker();
      const routes = Object.keys(report.routes ?? {});
      anomalies = Object.fromEntries(
        routes.map((route) => [route, tracker.analyze(route)])
      );
    }

    const html = renderDashboard(opts.title, report, anomalies);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  });

  router.get(`${opts.path}/json`, (_req: Request, res: Response) => {
    const report = generateReport();
    let anomalies: object | null = null;

    if (opts.includeAnomalies) {
      const tracker = getAnomalyTracker();
      const routes = Object.keys(report.routes ?? {});
      anomalies = Object.fromEntries(
        routes.map((route) => [route, tracker.analyze(route)])
      );
    }

    res.status(200).json({ report, anomalies });
  });

  return router;
}
