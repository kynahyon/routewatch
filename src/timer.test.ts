import { createTimer, formatDuration, isSlow } from './timer';

describe('createTimer', () => {
  it('should return a stop function', () => {
    const stop = createTimer();
    expect(typeof stop).toBe('function');
  });

  it('should return a TimerResult with durationMs >= 0', async () => {
    const stop = createTimer();
    await new Promise((resolve) => setTimeout(resolve, 10));
    const result = stop();

    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.durationMs).toBe('number');
    expect(typeof result.startTime).toBe('bigint');
    expect(typeof result.endTime).toBe('bigint');
  });

  it('should measure at least the waited time', async () => {
    const stop = createTimer();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const result = stop();

    expect(result.durationMs).toBeGreaterThanOrEqual(40);
  });

  it('endTime should be greater than or equal to startTime', () => {
    const stop = createTimer();
    const result = stop();

    expect(result.endTime).toBeGreaterThanOrEqual(result.startTime);
  });
});

describe('formatDuration', () => {
  it('should format sub-second durations in ms', () => {
    expect(formatDuration(123.456)).toBe('123.46ms');
  });

  it('should format durations >= 1000ms in seconds', () => {
    expect(formatDuration(1500)).toBe('1.50s');
  });

  it('should handle 0ms', () => {
    expect(formatDuration(0)).toBe('0.00ms');
  });

  it('should handle exactly 1000ms', () => {
    expect(formatDuration(1000)).toBe('1.00s');
  });
});

describe('isSlow', () => {
  it('should return true when duration exceeds threshold', () => {
    expect(isSlow(500, 200)).toBe(true);
  });

  it('should return false when duration is below threshold', () => {
    expect(isSlow(100, 200)).toBe(false);
  });

  it('should return false when duration equals threshold', () => {
    expect(isSlow(200, 200)).toBe(false);
  });
});
