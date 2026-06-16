import type { NextFunction, Request, Response } from 'express';
import type { ApiError } from '@ucpt/types';

/** Consistent error body: { error, code, details } (Part I §6). */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (msg = 'Not found') => new HttpError(404, 'not_found', msg);
export const unauthorized = (msg = 'Unauthorized') => new HttpError(401, 'unauthorized', msg);
export const forbidden = (msg = 'Forbidden') => new HttpError(403, 'forbidden', msg);

/** Placeholder for endpoints declared in the catalog but not yet implemented. */
export function notImplemented(name: string) {
  return (_req: Request, res: Response) => {
    res.status(501).json({
      error: `Endpoint not implemented: ${name}`,
      code: 'not_implemented',
    } satisfies ApiError);
  };
}

/** Wrap async handlers so rejections reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      details: err.details,
    } satisfies ApiError);
  }
  return res.status(500).json({ error: 'Internal server error', code: 'internal' } satisfies ApiError);
}
