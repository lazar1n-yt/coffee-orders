import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Middleware для валідації частин запиту через Zod-схему.
 * Замінює req[source] результатом parse() (із приведеними типами).
 */
export const validate =
  (schema: ZodSchema, source: Source = 'body'): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[source]);
    (req as unknown as Record<Source, unknown>)[source] = parsed;
    next();
  };
