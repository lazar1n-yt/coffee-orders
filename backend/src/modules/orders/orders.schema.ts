import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const createOrderSchema = z.object({
  customerName: z.string().min(2).max(100),
  phone: z
    .string()
    .min(5)
    .max(20)
    .regex(/^[+\d\s()-]+$/u, 'Невірний формат телефону'),
  comment: z.string().max(500).optional(),
  pickupTime: z.coerce
    .date()
    .refine((d) => d.getTime() > Date.now(), 'Час видачі має бути у майбутньому'),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1, 'Замовлення має містити щонайменше одну позицію'),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const listOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
