import { createCircuitBreakerMiddleware } from './circuit-breaker-middleware';
import { mockReq, mockRes } from './middleware.test';
import { EventEmitter } from 'events';

function buildRes() {
  const emitter = new EventEmitter();
  const res = {
    ...mockRes,
    on: emitter.on.bind(emitter),
    emit: emitter.emit.bind(emitter),
  };
  return { res, emitter };
}

describe('createCircuitBreakerMiddleware', () => {
  it('calls next()', () => {
    const middleware = createCircuitBreakerMiddleware();
    const next = jest.fn();
    const { res } = buildRes();
    middleware(mockReq as any, res as any, next);
    expect(next).toHaveBeenCalled();
  });

  it('does not trigger onOpen for fast requests', () => {
    const onOpen = jest.fn();
    const middleware = createCircuitBreakerMiddleware({
      slowThresholdMs: 1000,
      failureThreshold: 2,
      onOpen,
    });
    const next = jest.fn();
    const { res } = buildRes();
    middleware(mockReq as any, res as any, next);
    res.emit('finish');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('calls onOpen when circuit opens', () => {
    const onOpen = jest.fn();
    const middleware = createCircuitBreakerMiddleware({
      slowThresholdMs: 0,
      failureThreshold: 1,
      onOpen,
    });
    const next = jest.fn();
    const { res } = buildRes();

    middleware(mockReq as any, res as any, next);
    res.emit('finish');

    expect(onOpen).toHaveBeenCalledWith(
      expect.any(String),
      'open'
    );
  });

  it('does not call onOpen twice for the same open state', () => {
    const onOpen = jest.fn();
    const middleware = createCircuitBreakerMiddleware({
      slowThresholdMs: 0,
      failureThreshold: 1,
      onOpen,
    });
    const next = jest.fn();

    const { res: res1 } = buildRes();
    middleware(mockReq as any, res1 as any, next);
    res1.emit('finish');

    const { res: res2 } = buildRes();
    middleware(mockReq as any, res2 as any, next);
    res2.emit('finish');

    // onOpen should only fire on the transition, not on subsequent open records
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
