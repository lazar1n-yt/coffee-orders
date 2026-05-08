import type { RequestHandler } from 'express';
import { authService } from './auth.service.js';
import type { LoginDto, RegisterDto, RefreshDto } from './auth.schema.js';

export const authController = {
  register: (async (req, res) => {
    const result = await authService.register(req.body as RegisterDto);
    res.status(201).json(result);
  }) as RequestHandler,

  login: (async (req, res) => {
    const result = await authService.login(req.body as LoginDto);
    res.json(result);
  }) as RequestHandler,

  refresh: (async (req, res) => {
    const { refreshToken } = req.body as RefreshDto;
    const result = await authService.refresh(refreshToken);
    res.json(result);
  }) as RequestHandler,

  me: (async (req, res) => {
    res.json({ user: req.user });
  }) as RequestHandler,
};
