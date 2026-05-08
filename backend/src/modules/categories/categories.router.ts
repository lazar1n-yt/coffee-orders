import { Router } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { categoriesService } from './categories.service.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from './categories.schema.js';

export const categoriesRouter = Router();

categoriesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await categoriesService.list());
  }),
);

categoriesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await categoriesService.getById(req.params.id));
  }),
);

categoriesRouter.post(
  '/',
  requireAuth,
  requireRole(Role.ADMIN),
  validate(createCategorySchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await categoriesService.create(req.body));
  }),
);

categoriesRouter.patch(
  '/:id',
  requireAuth,
  requireRole(Role.ADMIN),
  validate(updateCategorySchema),
  asyncHandler(async (req, res) => {
    res.json(await categoriesService.update(req.params.id, req.body));
  }),
);

categoriesRouter.delete(
  '/:id',
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await categoriesService.remove(req.params.id);
    res.status(204).end();
  }),
);
