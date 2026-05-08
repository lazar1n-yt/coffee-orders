import { z } from 'zod';

const slug = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9-]+$/u, 'Slug повинен містити лише a-z, 0-9 та "-"');

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  slug,
  position: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
