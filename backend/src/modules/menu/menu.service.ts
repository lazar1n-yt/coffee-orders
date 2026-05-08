import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import type {
  CreateMenuItemDto,
  ListMenuQuery,
  UpdateMenuItemDto,
} from './menu.schema.js';

export const menuService = {
  list(q: ListMenuQuery) {
    return prisma.menuItem.findMany({
      where: {
        categoryId: q.categoryId,
        available: q.available,
      },
      orderBy: { name: 'asc' },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
  },

  async getById(id: string) {
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!item) throw new NotFoundError('Позицію меню не знайдено');
    return item;
  },

  async create(dto: CreateMenuItemDto) {
    await prisma.category.findUniqueOrThrow({ where: { id: dto.categoryId } });
    return prisma.menuItem.create({ data: dto });
  },

  async update(id: string, dto: UpdateMenuItemDto) {
    await this.getById(id);
    return prisma.menuItem.update({ where: { id }, data: dto });
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.menuItem.delete({ where: { id } });
  },
};
