import { dispatchAlert, createDefaultAlertHandlers, AlertContext, AlertConfig } from './alert';
import { createLogger } from './logger';

const makeContext = (level: 'ok' | 'warn' | 'critical', durationMs = 1000): AlertContext => ({
  method: 'GET',
  route: '/api/test',
  statusCode: 200,
  thresholdResult: {
    level,
    durationMs,
    warnMs: 500,
    criticalMs: 2000,
  },
});

describe('dispatchAlert', () => {
  it('calls onWarn handler for warn level', async () => {
    const onWarn = jest.fn();
    const config: AlertConfig = { onWarn };
    await dispatchAlert(makeContext('warn'), config);
    expect(onWarn).toHaveBeenCalledTimes(1);
    expect(onWarn).toHaveBeenCalledWith(expect.objectContaining({ route: '/api/test' }));
  });

  it('calls onCritical handler for critical level', async () => {
    const onCritical = jest.fn();
    const config: AlertConfig = { onCritical };
    await dispatchAlert(makeContext('critical', 3000), config);
    expect(onCritical).toHaveBeenCalledTimes(1);
  });

  it('does not call onWarn for critical level', async () => {
    const onWarn = jest.fn();
    const onCritical = jest.fn();
    await dispatchAlert(makeContext('critical'), { onWarn, onCritical });
    expect(onWarn).not.toHaveBeenCalled();
    expect(onCritical).toHaveBeenCalled();
  });

  it('does not call any handler for ok level', async () => {
    const onWarn = jest.fn();
    const onCritical = jest.fn();
    await dispatchAlert(makeContext('ok', 100), { onWarn, onCritical });
    expect(onWarn).not.toHaveBeenCalled();
    expect(onCritical).not.toHaveBeenCalled();
  });

  it('handles missing handlers gracefully', async () => {
    await expect(dispatchAlert(makeContext('warn'), {})).resolves.toBeUndefined();
  });

  it('awaits async handlers', async () => {
    const results: string[] = [];
    const onWarn = jest.fn(async () => {
      await Promise.resolve();
      results.push('done');
    });
    await dispatchAlert(makeContext('warn'), { onWarn });
    expect(results).toContain('done');
  });
});

describe('createDefaultAlertHandlers', () => {
  it('returns warn and critical handlers', () => {
    const logger = createLogger({ prefix: '[test]' });
    const handlers = createDefaultAlertHandlers(logger);
    expect(typeof handlers.onWarn).toBe('function');
    expect(typeof handlers.onCritical).toBe('function');
  });

  it('warn handler logs without throwing', () => {
    const logger = createLogger({ prefix: '[test]' });
    const handlers = createDefaultAlertHandlers(logger);
    expect(() => handlers.onWarn!(makeContext('warn'))).not.toThrow();
  });

  it('critical handler logs without throwing', () => {
    const logger = createLogger({ prefix: '[test]' });
    const handlers = createDefaultAlertHandlers(logger);
    expect(() => handlers.onCritical!(makeContext('critical', 3000))).not.toThrow();
  });
});
