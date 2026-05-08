import { Router } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { ordersService } from './orders.service.js';
import {
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from './orders.schema.js';

export const ordersRouter = Router();

// Створення замовлення доступне і анонімним користувачам.
ordersRouter.post(
  '/',
  validate(createOrderSchema),
  asyncHandler(async (req, res) => {
    const order = await ordersService.create(req.body, req.user?.sub);
    res.status(201).json(order);
  }),
);

ordersRouter.get(
  '/',
  requireAuth,
  requireRole(Role.ADMIN),
  validate(listOrdersQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await ordersService.list(req.query as never));
  }),
);

ordersRouter.get(
  '/:id',
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    res.json(await ordersService.getById(req.params.id));
  }),
);

ordersRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole(Role.ADMIN),
  validate(updateOrderStatusSchema),
  asyncHandler(async (req, res) => {
    res.json(await ordersService.updateStatus(req.params.id, req.body));
  }),
);
