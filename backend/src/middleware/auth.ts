import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export interface AuthUser {
  sub: string;
  email: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export const requireAuth: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Не надано access-токен');
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = {
      sub: String(payload.sub),
      email: String(payload.email),
      role: payload.role as Role,
    };
    next();
  } catch {
    throw new UnauthorizedError('Недійсний або прострочений токен');
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Недостатньо прав для цієї дії');
    }
    next();
  };
