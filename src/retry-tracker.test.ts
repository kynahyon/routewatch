import { createRetryTracker, RetryEntry } from './retry-tracker';

describe('createRetryTracker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an entry on first record', () => {
    const tracker = createRetryTracker();
    tracker.record('/api/users');
    const entry = tracker.getEntry('/api/users');
    expect(entry).toBeDefined();
    expect(entry?.count).toBe(1);
    expect(entry?.route).toBe('/api/users');
  });

  it('increments count on subsequent records within window', () => {
    const tracker = createRetryTracker({ windowMs: 60_000 });
    tracker.record('/api/users');
    tracker.record('/api/users');
    tracker.record('/api/users');
    expect(tracker.getEntry('/api/users')?.count).toBe(3);
  });

  it('resets count when record occurs outside window', () => {
    const tracker = createRetryTracker({ windowMs: 5_000 });
    tracker.record('/api/orders');
    tracker.record('/api/orders');
    jest.advanceTimersByTime(6_000);
    tracker.record('/api/orders');
    expect(tracker.getEntry('/api/orders')?.count).toBe(1);
  });

  it('calls onThresholdReached when threshold is hit', () => {
    const handler = jest.fn();
    const tracker = createRetryTracker({ threshold: 3, onThresholdReached: handler });

    tracker.record('/slow');
    tracker.record('/slow');
    expect(handler).not.toHaveBeenCalled();

    tracker.record('/slow');
    expect(handler).toHaveBeenCalledTimes(1);
    const arg: RetryEntry = handler.mock.calls[0][0];
    expect(arg.route).toBe('/slow');
    expect(arg.count).toBe(3);
  });

  it('does not call onThresholdReached again after threshold', () => {
    const handler = jest.fn();
    const tracker = createRetryTracker({ threshold: 2, onThresholdReached: handler });
    tracker.record('/api');
    tracker.record('/api');
    tracker.record('/api');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('tracks multiple routes independently', () => {
    const tracker = createRetryTracker();
    tracker.record('/a');
    tracker.record('/b');
    tracker.record('/a');
    expect(tracker.getEntry('/a')?.count).toBe(2);
    expect(tracker.getEntry('/b')?.count).toBe(1);
  });

  it('resets a specific route', () => {
    const tracker = createRetryTracker();
    tracker.record('/x');
    tracker.record('/y');
    tracker.reset('/x');
    expect(tracker.getEntry('/x')).toBeUndefined();
    expect(tracker.getEntry('/y')).toBeDefined();
  });

  it('resets all routes when no argument given', () => {
    const tracker = createRetryTracker();
    tracker.record('/x');
    tracker.record('/y');
    tracker.reset();
    expect(tracker.getEntry('/x')).toBeUndefined();
    expect(tracker.getEntry('/y')).toBeUndefined();
  });
});
