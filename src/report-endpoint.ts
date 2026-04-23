import { Request, Response, Router } from 'express';
import { generateReport, resetRecords } from './reporter';
import { ReporterConfig } from './types';

export function createReportRouter(config: ReporterConfig = {}): Router {
  const router = Router();

  router.get('/routewatch/report', (_req: Request, res: Response) => {
    try {
      const report = generateReport(config);
      res.status(200).json(report);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });

  router.delete('/routewatch/report', (_req: Request, res: Response) => {
    try {
      resetRecords();
      res.status(200).json({ message: 'Report data cleared' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reset records' });
    }
  });

  router.get('/routewatch/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
}
