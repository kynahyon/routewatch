import { Request } from 'express';
import { getCorrelationContext } from './correlation';

export interface CorrelationLogEntry {
  correlationId: string;
  requestId: string;
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
}

const entries: CorrelationLogEntry[] = [];
const MAX_ENTRIES = 500;

export function recordCorrelation(
  req: Request,
  route: string,
  statusCode: number,
  durationMs: number
): CorrelationLogEntry {
  const { correlationId, requestId } = getCorrelationContext(req);
  const entry: CorrelationLogEntry = {
    correlationId,
    requestId,
    route,
    method: req.method ?? 'UNKNOWN',
    statusCode,
    durationMs,
    timestamp: Date.now(),
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
  return entry;
}

export function getEntriesByCorrelationId(correlationId: string): CorrelationLogEntry[] {
  return entries.filter((e) => e.correlationId === correlationId);
}

export function getEntriesByRequestId(requestId: string): CorrelationLogEntry[] {
  return entries.filter((e) => e.requestId === requestId);
}

export function getAllEntries(): CorrelationLogEntry[] {
  return [...entries];
}

export function resetCorrelationRecords(): void {
  entries.length = 0;
}
