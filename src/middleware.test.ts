import { createExpressMiddleware } from './middleware';
import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';

function mockReq(overrides: Partial<Request> = {}): Request {
  return { method: 'GET', path: '/api/test', ...overrides } as Request;
}

function mockRes(overrides: Partial<Response> = {}): Response {
  const emitter = new EventEmitter();
  return {
    statusCode: 200,
    on: emitter.on.bind(emitter),
    emit: emitter.emit.bind(emitter),
    ...overrides,
  } as unknown as Response;
}

describe('createExpressMiddleware', () => {
  it('should call next()', () => {
    const middleware = createExpressMiddleware();
    const next = jest.fn() as NextFunction;
    const req = mockReq();
    const res = mockRes();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should log on response finish', () => {
    const logFn = jest.fn();
    const middleware = createExpressMiddleware({
      logger: { log: logFn },
    });
    const next = jest.fn() as NextFunction;
    const req = mockReq();
    const res = mockRes();

    middleware(req, res, next);
    (res as unknown as EventEmitter).emit('finish');

    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      route: '/api/test',
      status: 200,
    });
  });

  it('should trigger alert handler for slow routes', () => {
    const alertHandler = jest.fn();
    const middleware = createExpressMiddleware({
      thresholds: { default: 0 },
      alertHandlers: [alertHandler],
    });
    const next = jest.fn() as NextFunction;
    const req = mockReq();
    const res = mockRes();

    middleware(req, res, next);
    (res as unknown as EventEmitter).emit('finish');

    expect(alertHandler).toHaveBeenCalledTimes(1);
  });

  it('should not trigger alert handler for fast routes', () => {
    const alertHandler = jest.fn();
    const middleware = createExpressMiddleware({
      thresholds: { default: 999999 },
      alertHandlers: [alertHandler],
    });
    const next = jest.fn() as NextFunction;
    const req = mockReq();
    const res = mockRes();

    middleware(req, res, next);
    (res as unknown as EventEmitter).emit('finish');

    expect(alertHandler).not.toHaveBeenCalled();
  });
});
