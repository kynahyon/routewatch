import { RouteStats } from './types';

export interface AnomalyResult {
  route: string;
  zScore: number;
  mean: number;
  stdDev: number;
  latestP95: number;
  isAnomaly: boolean;
}

export interface AnomalyDetectorOptions {
  zScoreThreshold?: number;
  minSamples?: number;
}

const DEFAULT_Z_THRESHOLD = 2.5;
const DEFAULT_MIN_SAMPLES = 5;

export function computeMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function computeStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function computeZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

export function detectAnomaly(
  route: string,
  history: number[],
  latestP95: number,
  options: AnomalyDetectorOptions = {}
): AnomalyResult {
  const zThreshold = options.zScoreThreshold ?? DEFAULT_Z_THRESHOLD;
  const minSamples = options.minSamples ?? DEFAULT_MIN_SAMPLES;

  const mean = computeMean(history);
  const stdDev = computeStdDev(history, mean);
  const zScore = computeZScore(latestP95, mean, stdDev);
  const isAnomaly = history.length >= minSamples && Math.abs(zScore) > zThreshold;

  return { route, zScore, mean, stdDev, latestP95, isAnomaly };
}

export function detectAnomalies(
  statsMap: Map<string, RouteStats>,
  p95History: Map<string, number[]>,
  options: AnomalyDetectorOptions = {}
): AnomalyResult[] {
  const results: AnomalyResult[] = [];

  for (const [route, stats] of statsMap.entries()) {
    const history = p95History.get(route) ?? [];
    const result = detectAnomaly(route, history, stats.p95, options);
    results.push(result);
  }

  return results;
}
