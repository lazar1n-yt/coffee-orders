import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { authController } from './auth.controller.js';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from './auth.schema.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  validate(registerSchema),
  asyncHandler(authController.register),
);
authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(authController.login),
);
authRouter.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(authController.refresh),
);
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
