/**
 * sampler.ts
 * Controls route sampling to avoid logging/alerting on every request.
 * Useful for high-traffic APIs where full logging is too noisy.
 */

export interface SamplerConfig {
  /** Rate between 0 and 1. 1.0 = log everything, 0.1 = log ~10% */
  rate: number;
  /** Optional per-route overrides */
  routeOverrides?: Record<string, number>;
}

export interface Sampler {
  shouldSample(route: string): boolean;
  getRate(route: string): number;
}

const DEFAULT_RATE = 1.0;

export function createSampler(config?: Partial<SamplerConfig>): Sampler {
  const rate = clampRate(config?.rate ?? DEFAULT_RATE);
  const routeOverrides = config?.routeOverrides ?? {};

  function getRate(route: string): number {
    if (route in routeOverrides) {
      return clampRate(routeOverrides[route]);
    }
    return rate;
  }

  function shouldSample(route: string): boolean {
    const effectiveRate = getRate(route);
    if (effectiveRate >= 1.0) return true;
    if (effectiveRate <= 0.0) return false;
    return Math.random() < effectiveRate;
  }

  return { shouldSample, getRate };
}

function clampRate(value: number): number {
  return Math.max(0, Math.min(1, value));
}
