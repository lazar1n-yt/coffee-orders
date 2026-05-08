import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { Role, type User } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import {
  ConflictError,
  UnauthorizedError,
} from '../../utils/errors.js';
import type { LoginDto, RegisterDto } from './auth.schema.js';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const signTokens = (user: User): TokenPair => {
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  } as SignOptions);
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  } as SignOptions);
  return { accessToken, refreshToken };
};

export const authService = {
  async register(dto: RegisterDto): Promise<TokenPair & { user: PublicUser }> {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictError('Користувач із таким email вже існує');
    }
    const passwordHash = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: Role.CUSTOMER,
      },
    });
    return { ...signTokens(user), user: toPublic(user) };
  },

  async login(dto: LoginDto): Promise<TokenPair & { user: PublicUser }> {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Невірний email або пароль');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError('Невірний email або пароль');
    }
    return { ...signTokens(user), user: toPublic(user) };
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        sub: string;
      };
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedError();
      return signTokens(user);
    } catch {
      throw new UnauthorizedError('Недійсний refresh-токен');
    }
  },
};

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

const toPublic = (u: User): PublicUser => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName,
  role: u.role,
});
