import { createDeduplicator } from './deduplicator';

describe('createDeduplicator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow the first alert for an unseen route', () => {
    const dedup = createDeduplicator({ cooldownMs: 5000 });
    expect(dedup.shouldAlert('GET /api/users')).toBe(true);
  });

  it('should suppress a second alert within the cooldown window', () => {
    const dedup = createDeduplicator({ cooldownMs: 5000 });
    dedup.record('GET /api/users');
    jest.advanceTimersByTime(2000);
    expect(dedup.shouldAlert('GET /api/users')).toBe(false);
  });

  it('should allow an alert after the cooldown window has elapsed', () => {
    const dedup = createDeduplicator({ cooldownMs: 5000 });
    dedup.record('GET /api/users');
    jest.advanceTimersByTime(6000);
    expect(dedup.shouldAlert('GET /api/users')).toBe(true);
  });

  it('should track alert count correctly', () => {
    const dedup = createDeduplicator({ cooldownMs: 1000 });
    dedup.record('POST /api/orders');
    jest.advanceTimersByTime(2000);
    dedup.record('POST /api/orders');
    const entry = dedup.getEntry('POST /api/orders');
    expect(entry?.count).toBe(2);
  });

  it('should return undefined for an entry that has never been recorded', () => {
    const dedup = createDeduplicator();
    expect(dedup.getEntry('GET /unknown')).toBeUndefined();
  });

  it('should reset a specific route entry', () => {
    const dedup = createDeduplicator({ cooldownMs: 60000 });
    dedup.record('GET /api/health');
    dedup.reset('GET /api/health');
    expect(dedup.getEntry('GET /api/health')).toBeUndefined();
    expect(dedup.shouldAlert('GET /api/health')).toBe(true);
  });

  it('should reset all entries when no key is provided', () => {
    const dedup = createDeduplicator({ cooldownMs: 60000 });
    dedup.record('GET /api/a');
    dedup.record('GET /api/b');
    dedup.reset();
    expect(dedup.getEntry('GET /api/a')).toBeUndefined();
    expect(dedup.getEntry('GET /api/b')).toBeUndefined();
  });

  it('should use a default cooldown of 60 seconds when none is specified', () => {
    const dedup = createDeduplicator();
    dedup.record('DELETE /api/resource');
    jest.advanceTimersByTime(59_999);
    expect(dedup.shouldAlert('DELETE /api/resource')).toBe(false);
    jest.advanceTimersByTime(1);
    expect(dedup.shouldAlert('DELETE /api/resource')).toBe(true);
  });

  it('should handle multiple independent routes independently', () => {
    const dedup = createDeduplicator({ cooldownMs: 5000 });
    dedup.record('GET /api/x');
    expect(dedup.shouldAlert('GET /api/y')).toBe(true);
    expect(dedup.shouldAlert('GET /api/x')).toBe(false);
  });
});
