export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
  durationFormatted: string;
  slow: boolean;
}

export interface LoggerOptions {
  /** Custom log function. Defaults to console.log/warn/error */
  logFn?: (level: LogLevel, entry: LogEntry) => void;
  /** Whether to include timestamp in output. Defaults to true */
  includeTimestamp?: boolean;
  /** Whether to log all requests or only slow ones. Defaults to false (log all) */
  slowOnly?: boolean;
}

const defaultLogFn = (level: LogLevel, entry: LogEntry): void => {
  const parts: string[] = [];

  if (entry.timestamp) {
    parts.push(`[${entry.timestamp}]`);
  }

  parts.push(`[routewatch]`);
  parts.push(`${entry.method} ${entry.route}`);
  parts.push(`${entry.statusCode}`);
  parts.push(entry.durationFormatted);

  if (entry.slow) {
    parts.push('⚠ SLOW');
  }

  const message = parts.join(' | ');

  if (level === 'warn') {
    console.warn(message);
  } else if (level === 'error') {
    console.error(message);
  } else {
    console.log(message);
  }
};

export function createLogger(options: LoggerOptions = {}) {
  const {
    logFn = defaultLogFn,
    includeTimestamp = true,
    slowOnly = false,
  } = options;

  return function log(entry: Omit<LogEntry, 'timestamp'>): void {
    if (slowOnly && !entry.slow) {
      return;
    }

    const fullEntry: LogEntry = {
      ...entry,
      timestamp: includeTimestamp ? new Date().toISOString() : '',
    };

    const level: LogLevel = entry.slow ? 'warn' : 'info';
    logFn(level, fullEntry);
  };
}
