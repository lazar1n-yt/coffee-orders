import { z } from 'zod';

export const listMenuQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  available: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const createMenuItemSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  priceCents: z.number().int().min(1).max(1_000_000),
  imageUrl: z.string().url().optional(),
  available: z.boolean().default(true),
  categoryId: z.string().uuid(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export type ListMenuQuery = z.infer<typeof listMenuQuerySchema>;
export type CreateMenuItemDto = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemDto = z.infer<typeof updateMenuItemSchema>;
