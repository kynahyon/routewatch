import { RouteStats } from './types';
import { detectAnomalies, AnomalyResult, AnomalyDetectorOptions } from './anomaly';

export interface AnomalyTrackerOptions extends AnomalyDetectorOptions {
  maxHistoryLength?: number;
}

const DEFAULT_MAX_HISTORY = 50;

export interface AnomalyTracker {
  record(route: string, p95: number): void;
  analyze(statsMap: Map<string, RouteStats>): AnomalyResult[];
  getHistory(route: string): number[];
  reset(route?: string): void;
}

export function createAnomalyTracker(options: AnomalyTrackerOptions = {}): AnomalyTracker {
  const maxHistory = options.maxHistoryLength ?? DEFAULT_MAX_HISTORY;
  const p95History = new Map<string, number[]>();

  function record(route: string, p95: number): void {
    if (!p95History.has(route)) {
      p95History.set(route, []);
    }
    const history = p95History.get(route)!;
    history.push(p95);
    if (history.length > maxHistory) {
      history.shift();
    }
  }

  function analyze(statsMap: Map<string, RouteStats>): AnomalyResult[] {
    return detectAnomalies(statsMap, p95History, options);
  }

  function getHistory(route: string): number[] {
    return [...(p95History.get(route) ?? [])];
  }

  function reset(route?: string): void {
    if (route) {
      p95History.delete(route);
    } else {
      p95History.clear();
    }
  }

  return { record, analyze, getHistory, reset };
}
