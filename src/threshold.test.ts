import {
  evaluateThreshold,
  resolveThresholds,
  mergeThresholdConfig,
  DEFAULT_THRESHOLD_CONFIG,
  ThresholdConfig,
} from './threshold';

describe('resolveThresholds', () => {
  const config: ThresholdConfig = {
    warnMs: 500,
    criticalMs: 2000,
    routes: {
      '/api/slow': { warnMs: 1000, criticalMs: 5000 },
    },
  };

  it('returns global thresholds for unknown routes', () => {
    const result = resolveThresholds(config, '/api/fast');
    expect(result).toEqual({ warnMs: 500, criticalMs: 2000 });
  });

  it('returns route-specific thresholds when defined', () => {
    const result = resolveThresholds(config, '/api/slow');
    expect(result).toEqual({ warnMs: 1000, criticalMs: 5000 });
  });

  it('uses global thresholds when no routes config provided', () => {
    const simple: ThresholdConfig = { warnMs: 300, criticalMs: 1000 };
    const result = resolveThresholds(simple, '/any/route');
    expect(result).toEqual({ warnMs: 300, criticalMs: 1000 });
  });
});

describe('evaluateThreshold', () => {
  const config = DEFAULT_THRESHOLD_CONFIG;

  it('returns ok when duration is below warn threshold', () => {
    const result = evaluateThreshold(100, config, '/api/test');
    expect(result.level).toBe('ok');
  });

  it('returns warn when duration meets warn threshold', () => {
    const result = evaluateThreshold(500, config, '/api/test');
    expect(result.level).toBe('warn');
  });

  it('returns warn when duration is between warn and critical', () => {
    const result = evaluateThreshold(1200, config, '/api/test');
    expect(result.level).toBe('warn');
  });

  it('returns critical when duration meets critical threshold', () => {
    const result = evaluateThreshold(2000, config, '/api/test');
    expect(result.level).toBe('critical');
  });

  it('includes threshold values in result', () => {
    const result = evaluateThreshold(750, config, '/api/test');
    expect(result.warnMs).toBe(500);
    expect(result.criticalMs).toBe(2000);
    expect(result.durationMs).toBe(750);
  });
});

describe('mergeThresholdConfig', () => {
  it('merges top-level fields', () => {
    const result = mergeThresholdConfig(DEFAULT_THRESHOLD_CONFIG, { warnMs: 300 });
    expect(result.warnMs).toBe(300);
    expect(result.criticalMs).toBe(DEFAULT_THRESHOLD_CONFIG.criticalMs);
  });

  it('merges route overrides without losing defaults', () => {
    const base: ThresholdConfig = {
      warnMs: 500,
      criticalMs: 2000,
      routes: { '/api/a': { warnMs: 100, criticalMs: 500 } },
    };
    const result = mergeThresholdConfig(base, {
      routes: { '/api/b': { warnMs: 200, criticalMs: 1000 } },
    });
    expect(result.routes?.['/api/a']).toBeDefined();
    expect(result.routes?.['/api/b']).toBeDefined();
  });
});
