import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './categories.schema.js';

export const categoriesService = {
  list() {
    return prisma.category.findMany({ orderBy: { position: 'asc' } });
  },

  async getById(id: string) {
    const c = await prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundError('Категорію не знайдено');
    return c;
  },

  create(dto: CreateCategoryDto) {
    return prisma.category.create({ data: dto });
  },

  async update(id: string, dto: UpdateCategoryDto) {
    await this.getById(id);
    return prisma.category.update({ where: { id }, data: dto });
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.category.delete({ where: { id } });
  },
};
