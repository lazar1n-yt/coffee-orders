import { Router } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { menuService } from './menu.service.js';
import {
  createMenuItemSchema,
  listMenuQuerySchema,
  updateMenuItemSchema,
} from './menu.schema.js';

export const menuRouter = Router();

menuRouter.get(
  '/',
  validate(listMenuQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await menuService.list(req.query as never));
  }),
);

menuRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await menuService.getById(req.params.id));
  }),
);

menuRouter.post(
  '/',
  requireAuth,
  requireRole(Role.ADMIN),
  validate(createMenuItemSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await menuService.create(req.body));
  }),
);

menuRouter.patch(
  '/:id',
  requireAuth,
  requireRole(Role.ADMIN),
  validate(updateMenuItemSchema),
  asyncHandler(async (req, res) => {
    res.json(await menuService.update(req.params.id, req.body));
  }),
);

menuRouter.delete(
  '/:id',
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await menuService.remove(req.params.id);
    res.status(204).end();
  }),
);
