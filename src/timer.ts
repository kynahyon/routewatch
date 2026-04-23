/**
 * Timer utilities for measuring request duration.
 */

export interface TimerResult {
  startTime: bigint;
  endTime: bigint;
  durationMs: number;
}

/**
 * Starts a high-resolution timer using process.hrtime.bigint().
 * Returns a function that, when called, returns the elapsed time in milliseconds.
 */
export function createTimer(): () => TimerResult {
  const startTime = process.hrtime.bigint();

  return function stop(): TimerResult {
    const endTime = process.hrtime.bigint();
    const durationNs = endTime - startTime;
    const durationMs = Number(durationNs) / 1_000_000;

    return {
      startTime,
      endTime,
      durationMs,
    };
  };
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Determines whether a given duration exceeds the threshold.
 */
export function isSlow(durationMs: number, thresholdMs: number): boolean {
  return durationMs > thresholdMs;
}
