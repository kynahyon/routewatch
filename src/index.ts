/**
 * routewatch — Lightweight middleware for logging and alerting on slow API routes
 *
 * Main entry point. Re-exports all public-facing APIs for Express and Fastify integration.
 */

// Middleware
export { createExpressMiddleware } from './middleware';
export { routewatchFastifyPlugin } from './fastify-plugin';

// Reporting
export { createReportRouter } from './report-endpoint';
export {
  recordRequest,
  getRouteStats,
  generateReport,
  resetRecords,
} from './reporter';

// Alerting
export { createDefaultAlertHandlers } from './alert';

// Logging
export { createLogger } from './logger';

// Sampling
export { createSampler, getRate, shouldSample, clampRate } from './sampler';

// Thresholds
export {
  resolveThresholds,
  evaluateThreshold,
  mergeThresholdConfig,
} from './threshold';

// Timer utilities
export { createTimer, formatDuration, isSlow } from './timer';

// Types
export type {
  RouteWatchOptions,
  ThresholdConfig,
  RouteThreshold,
  AlertHandler,
  AlertEvent,
  LoggerOptions,
  RouteStats,
  RouteReport,
  SamplerOptions,
  RequestRecord,
} from './types';
