import { Router } from 'express';
import { authRouter } from './modules/auth/auth.router.js';
import { categoriesRouter } from './modules/categories/categories.router.js';
import { menuRouter } from './modules/menu/menu.router.js';
import { ordersRouter } from './modules/orders/orders.router.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/menu', menuRouter);
apiRouter.use('/orders', ordersRouter);
