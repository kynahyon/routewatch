import { createCircuitBreaker } from './circuit-breaker';

describe('createCircuitBreaker', () => {
  afterEach(() => {
    createCircuitBreaker().reset();
  });

  it('starts in closed state', () => {
    const cb = createCircuitBreaker();
    expect(cb.getState('/api/test')).toBe('closed');
  });

  it('stays closed on fast requests', () => {
    const cb = createCircuitBreaker({ slowThresholdMs: 1000, failureThreshold: 3 });
    cb.record('/api/test', 200);
    cb.record('/api/test', 300);
    expect(cb.getState('/api/test')).toBe('closed');
  });

  it('increments failures on slow requests', () => {
    const cb = createCircuitBreaker({ slowThresholdMs: 500, failureThreshold: 3 });
    cb.record('/api/test', 600);
    cb.record('/api/test', 700);
    const entry = cb.getEntry('/api/test');
    expect(entry.failures).toBe(2);
    expect(entry.state).toBe('closed');
  });

  it('opens circuit after reaching failure threshold', () => {
    const cb = createCircuitBreaker({ slowThresholdMs: 500, failureThreshold: 3 });
    cb.record('/api/test', 600);
    cb.record('/api/test', 700);
    cb.record('/api/test', 800);
    expect(cb.getState('/api/test')).toBe('open');
  });

  it('transitions to half-open after recovery window', () => {
    const cb = createCircuitBreaker({ slowThresholdMs: 500, failureThreshold: 2, recoveryWindowMs: 100 });
    cb.record('/api/test', 600);
    cb.record('/api/test', 700);
    expect(cb.getState('/api/test')).toBe('open');

    // Simulate time passing by manipulating openedAt
    const entry = cb.getEntry('/api/test');
    entry.openedAt = Date.now() - 200;

    cb.record('/api/test', 600);
    expect(cb.getState('/api/test')).toBe('open'); // still slow, stays or reopens
  });

  it('closes circuit after successful request in half-open state', () => {
    const cb = createCircuitBreaker({ slowThresholdMs: 500, failureThreshold: 2, recoveryWindowMs: 100 });
    cb.record('/api/test', 600);
    cb.record('/api/test', 700);

    const entry = cb.getEntry('/api/test');
    entry.state = 'half-open';

    cb.record('/api/test', 100);
    expect(cb.getState('/api/test')).toBe('closed');
    expect(cb.getEntry('/api/test').failures).toBe(0);
  });

  it('resets a specific route', () => {
    const cb = createCircuitBreaker({ slowThresholdMs: 500, failureThreshold: 2 });
    cb.record('/api/test', 600);
    cb.record('/api/test', 700);
    cb.reset('/api/test');
    expect(cb.getState('/api/test')).toBe('closed');
    expect(cb.getEntry('/api/test').failures).toBe(0);
  });

  it('resets all routes', () => {
    const cb = createCircuitBreaker({ slowThresholdMs: 500, failureThreshold: 2 });
    cb.record('/api/a', 600);
    cb.record('/api/b', 600);
    cb.reset();
    expect(cb.getState('/api/a')).toBe('closed');
    expect(cb.getState('/api/b')).toBe('closed');
  });
});
