import { Request } from 'express';
import {
  recordCorrelation,
  getEntriesByCorrelationId,
  getEntriesByRequestId,
  getAllEntries,
  resetCorrelationRecords,
} from './correlation-reporter';

function makeReq(correlationId: string, requestId: string, method = 'GET'): Request {
  return {
    method,
    headers: {},
    correlationId,
    requestId,
  } as unknown as Request;
}

describe('correlation-reporter', () => {
  beforeEach(() => {
    resetCorrelationRecords();
  });

  it('records a correlation entry', () => {
    const req = makeReq('cid-1', 'rid-1');
    const entry = recordCorrelation(req, '/api/users', 200, 42);
    expect(entry.correlationId).toBe('cid-1');
    expect(entry.requestId).toBe('rid-1');
    expect(entry.route).toBe('/api/users');
    expect(entry.statusCode).toBe(200);
    expect(entry.durationMs).toBe(42);
    expect(entry.method).toBe('GET');
  });

  it('returns all entries', () => {
    recordCorrelation(makeReq('c1', 'r1'), '/a', 200, 10);
    recordCorrelation(makeReq('c2', 'r2'), '/b', 500, 20);
    expect(getAllEntries()).toHaveLength(2);
  });

  it('filters entries by correlationId', () => {
    recordCorrelation(makeReq('shared-cid', 'r1'), '/a', 200, 5);
    recordCorrelation(makeReq('shared-cid', 'r2'), '/b', 201, 8);
    recordCorrelation(makeReq('other-cid', 'r3'), '/c', 200, 3);
    const found = getEntriesByCorrelationId('shared-cid');
    expect(found).toHaveLength(2);
    expect(found.every((e) => e.correlationId === 'shared-cid')).toBe(true);
  });

  it('filters entries by requestId', () => {
    recordCorrelation(makeReq('c1', 'target-rid'), '/x', 200, 15);
    recordCorrelation(makeReq('c2', 'other-rid'), '/y', 200, 10);
    const found = getEntriesByRequestId('target-rid');
    expect(found).toHaveLength(1);
    expect(found[0].requestId).toBe('target-rid');
  });

  it('returns empty array when no match', () => {
    recordCorrelation(makeReq('c1', 'r1'), '/a', 200, 5);
    expect(getEntriesByCorrelationId('nonexistent')).toEqual([]);
  });

  it('resets all records', () => {
    recordCorrelation(makeReq('c1', 'r1'), '/a', 200, 5);
    resetCorrelationRecords();
    expect(getAllEntries()).toHaveLength(0);
  });

  it('includes a timestamp on each entry', () => {
    const before = Date.now();
    const entry = recordCorrelation(makeReq('c1', 'r1'), '/ts', 200, 1);
    const after = Date.now();
    expect(entry.timestamp).toBeGreaterThanOrEqual(before);
    expect(entry.timestamp).toBeLessThanOrEqual(after);
  });
});
