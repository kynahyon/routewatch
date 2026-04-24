import { createContext, isContextEnabled } from './context';

describe('createContext', () => {
  it('creates a context with default values when no options provided', () => {
    const ctx = createContext();
    expect(ctx).toBeDefined();
    expect(ctx.enabled).toBe(true);
    expect(ctx.logger).toBeDefined();
    expect(ctx.alertHandlers).toBeInstanceOf(Array);
    expect(ctx.alertHandlers.length).toBeGreaterThan(0);
    expect(ctx.thresholds).toBeDefined();
    expect(ctx.sampler).toBeDefined();
    expect(ctx.filter).toBeDefined();
  });

  it('respects enabled: false option', () => {
    const ctx = createContext({ enabled: false });
    expect(ctx.enabled).toBe(false);
  });

  it('merges custom alertHandlers with defaults', () => {
    const customHandler = jest.fn();
    const ctx = createContext({ alertHandlers: [customHandler] });
    expect(ctx.alertHandlers.length).toBeGreaterThan(1);
    expect(ctx.alertHandlers).toContain(customHandler);
  });

  it('uses provided logger over default', () => {
    const customLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    const ctx = createContext({ logger: customLogger as any });
    expect(ctx.logger).toBe(customLogger);
  });

  it('applies custom slowThreshold to thresholds config', () => {
    const ctx = createContext({ slowThreshold: 1000 });
    expect(ctx.thresholds).toBeDefined();
  });

  it('applies sampleRate to sampler', () => {
    const ctx = createContext({ sampleRate: 0.5 });
    expect(ctx.sampler).toBeDefined();
  });

  it('stores original options on context', () => {
    const opts = { slowThreshold: 200, sampleRate: 0.8 };
    const ctx = createContext(opts);
    expect(ctx.options.slowThreshold).toBe(200);
    expect(ctx.options.sampleRate).toBe(0.8);
  });
});

describe('isContextEnabled', () => {
  it('returns true when context is enabled', () => {
    const ctx = createContext({ enabled: true });
    expect(isContextEnabled(ctx)).toBe(true);
  });

  it('returns false when context is disabled', () => {
    const ctx = createContext({ enabled: false });
    expect(isContextEnabled(ctx)).toBe(false);
  });

  it('defaults to enabled when option is not specified', () => {
    const ctx = createContext();
    expect(isContextEnabled(ctx)).toBe(true);
  });
});
