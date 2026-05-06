import { Request, Response } from 'express';
import {
  extractCorrelationId,
  createCorrelationMiddleware,
  getCorrelationContext,
  CORRELATION_HEADER,
  REQUEST_ID_HEADER,
} from './correlation';

function buildReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

function buildRes(): Response {
  const headers: Record<string, string> = {};
  return {
    setHeader: (k: string, v: string) => { headers[k] = v; },
    _headers: headers,
  } as unknown as Response;
}

describe('extractCorrelationId', () => {
  it('returns the header value when present', () => {
    const req = buildReq({ 'x-correlation-id': 'abc-123' });
    expect(extractCorrelationId(req)).toBe('abc-123');
  });

  it('returns undefined when header is absent', () => {
    const req = buildReq({});
    expect(extractCorrelationId(req)).toBeUndefined();
  });

  it('returns first value when header is an array', () => {
    const req = { headers: { 'x-correlation-id': ['first', 'second'] } } as unknown as Request;
    expect(extractCorrelationId(req)).toBe('first');
  });

  it('uses a custom header name', () => {
    const req = buildReq({ 'x-trace-id': 'trace-99' });
    expect(extractCorrelationId(req, 'x-trace-id')).toBe('trace-99');
  });
});

describe('createCorrelationMiddleware', () => {
  it('preserves incoming correlation id', () => {
    const req = buildReq({ 'x-correlation-id': 'existing-id' });
    const res = buildRes();
    const next = jest.fn();
    createCorrelationMiddleware()(req, res, next);
    expect((req as any).correlationId).toBe('existing-id');
    expect(next).toHaveBeenCalled();
  });

  it('generates a correlation id when not provided', () => {
    const req = buildReq({});
    const res = buildRes();
    const next = jest.fn();
    createCorrelationMiddleware()(req, res, next);
    expect((req as any).correlationId).toBeDefined();
    expect(typeof (req as any).correlationId).toBe('string');
  });

  it('always generates a unique requestId', () => {
    const req = buildReq({ 'x-correlation-id': 'same' });
    const res = buildRes();
    const next = jest.fn();
    createCorrelationMiddleware()(req, res, next);
    expect((req as any).requestId).toBeDefined();
    expect((req as any).requestId).not.toBe('same');
  });

  it('propagates headers to response', () => {
    const req = buildReq({ 'x-correlation-id': 'prop-id' });
    const res = buildRes();
    const next = jest.fn();
    createCorrelationMiddleware({ propagate: true })(req, res, next);
    expect((res as any)._headers[CORRELATION_HEADER]).toBe('prop-id');
    expect((res as any)._headers[REQUEST_ID_HEADER]).toBeDefined();
  });

  it('skips propagation when propagate is false', () => {
    const req = buildReq({ 'x-correlation-id': 'no-prop' });
    const res = buildRes();
    const next = jest.fn();
    createCorrelationMiddleware({ propagate: false })(req, res, next);
    expect((res as any)._headers[CORRELATION_HEADER]).toBeUndefined();
  });

  it('uses custom generateId function', () => {
    const req = buildReq({});
    const res = buildRes();
    const next = jest.fn();
    createCorrelationMiddleware({ generateId: () => 'fixed-id' })(req, res, next);
    expect((req as any).correlationId).toBe('fixed-id');
  });
});

describe('getCorrelationContext', () => {
  it('returns ids from request', () => {
    const req = buildReq({});
    (req as any).correlationId = 'cid';
    (req as any).requestId = 'rid';
    expect(getCorrelationContext(req)).toEqual({ correlationId: 'cid', requestId: 'rid' });
  });

  it('returns unknown for missing ids', () => {
    const req = buildReq({});
    expect(getCorrelationContext(req)).toEqual({ correlationId: 'unknown', requestId: 'unknown' });
  });
});
