import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

export const CORRELATION_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

export interface CorrelationOptions {
  header?: string;
  generateId?: () => string;
  propagate?: boolean;
}

export interface CorrelationContext {
  correlationId: string;
  requestId: string;
}

export function extractCorrelationId(
  req: Request,
  header: string = CORRELATION_HEADER
): string | undefined {
  const value = req.headers[header];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function createCorrelationMiddleware(options: CorrelationOptions = {}) {
  const {
    header = CORRELATION_HEADER,
    generateId = uuidv4,
    propagate = true,
  } = options;

  return function correlationMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const incoming = extractCorrelationId(req, header);
    const correlationId = incoming ?? generateId();
    const requestId = generateId();

    (req as any).correlationId = correlationId;
    (req as any).requestId = requestId;

    if (propagate) {
      res.setHeader(header, correlationId);
      res.setHeader(REQUEST_ID_HEADER, requestId);
    }

    next();
  };
}

export function getCorrelationContext(req: Request): CorrelationContext {
  return {
    correlationId: (req as any).correlationId ?? 'unknown',
    requestId: (req as any).requestId ?? 'unknown',
  };
}
