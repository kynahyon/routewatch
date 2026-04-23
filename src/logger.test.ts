import { createLogger, LogEntry, LogLevel } from './logger';

describe('createLogger', () => {
  const baseEntry: Omit<LogEntry, 'timestamp'> = {
    level: 'info',
    method: 'GET',
    route: '/api/users',
    statusCode: 200,
    durationMs: 45,
    durationFormatted: '45ms',
    slow: false,
  };

  it('calls logFn with info level for normal requests', () => {
    const logFn = jest.fn();
    const log = createLogger({ logFn });

    log(baseEntry);

    expect(logFn).toHaveBeenCalledTimes(1);
    const [level] = logFn.mock.calls[0] as [LogLevel, LogEntry];
    expect(level).toBe('info');
  });

  it('calls logFn with warn level for slow requests', () => {
    const logFn = jest.fn();
    const log = createLogger({ logFn });

    log({ ...baseEntry, slow: true, durationMs: 1500, durationFormatted: '1.50s' });

    expect(logFn).toHaveBeenCalledTimes(1);
    const [level] = logFn.mock.calls[0] as [LogLevel, LogEntry];
    expect(level).toBe('warn');
  });

  it('includes timestamp by default', () => {
    const logFn = jest.fn();
    const log = createLogger({ logFn });

    log(baseEntry);

    const [, entry] = logFn.mock.calls[0] as [LogLevel, LogEntry];
    expect(entry.timestamp).toBeTruthy();
    expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
  });

  it('omits timestamp when includeTimestamp is false', () => {
    const logFn = jest.fn();
    const log = createLogger({ logFn, includeTimestamp: false });

    log(baseEntry);

    const [, entry] = logFn.mock.calls[0] as [LogLevel, LogEntry];
    expect(entry.timestamp).toBe('');
  });

  it('skips non-slow requests when slowOnly is true', () => {
    const logFn = jest.fn();
    const log = createLogger({ logFn, slowOnly: true });

    log(baseEntry);
    expect(logFn).not.toHaveBeenCalled();
  });

  it('logs slow requests when slowOnly is true', () => {
    const logFn = jest.fn();
    const log = createLogger({ logFn, slowOnly: true });

    log({ ...baseEntry, slow: true });
    expect(logFn).toHaveBeenCalledTimes(1);
  });

  it('passes full entry details to logFn', () => {
    const logFn = jest.fn();
    const log = createLogger({ logFn });

    log(baseEntry);

    const [, entry] = logFn.mock.calls[0] as [LogLevel, LogEntry];
    expect(entry.method).toBe('GET');
    expect(entry.route).toBe('/api/users');
    expect(entry.statusCode).toBe(200);
    expect(entry.durationMs).toBe(45);
  });
});
