import type { ThresholdConfig } from './threshold';
import type { LoggerOptions } from './logger';
import type { AlertHandler } from './alert';

export interface RouteWatchOptions {
  /** Threshold configuration for slow route detection */
  thresholds?: Partial<ThresholdConfig>;
  /** Logger options or a custom logger instance */
  logger?: LoggerOptions | { log: (entry: LogEntry) => void };
  /** Custom alert handlers invoked when a slow route is detected */
  alertHandlers?: AlertHandler[];
}

export interface LogEntry {
  method: string;
  route: string;
  status: number;
  duration: number;
  slow: boolean;
  level: 'warn' | 'error' | 'info';
}

export interface AlertPayload {
  method: string;
  route: string;
  status: number;
  duration: number;
  level: 'warn' | 'error' | 'info';
}
