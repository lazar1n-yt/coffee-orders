import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import {
  BadRequestError,
  NotFoundError,
} from '../../utils/errors.js';
import type {
  CreateOrderDto,
  ListOrdersQuery,
  UpdateOrderStatusDto,
} from './orders.schema.js';

export const ordersService = {
  async create(dto: CreateOrderDto, userId?: string) {
    const ids = dto.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: ids } },
    });

    if (menuItems.length !== ids.length) {
      throw new BadRequestError('Деяких позицій меню не існує');
    }
    const unavailable = menuItems.filter((m) => !m.available);
    if (unavailable.length > 0) {
      throw new BadRequestError('Деякі позиції наразі недоступні', {
        unavailable: unavailable.map((m) => m.id),
      });
    }

    const byId = new Map(menuItems.map((m) => [m.id, m]));
    let totalCents = 0;
    const itemsData: Prisma.OrderItemCreateManyOrderInput[] = dto.items.map((i) => {
      const m = byId.get(i.menuItemId)!;
      totalCents += m.priceCents * i.quantity;
      return {
        menuItemId: m.id,
        nameSnapshot: m.name,
        priceCents: m.priceCents,
        quantity: i.quantity,
      };
    });

    return prisma.order.create({
      data: {
        userId,
        customerName: dto.customerName,
        phone: dto.phone,
        comment: dto.comment,
        pickupTime: dto.pickupTime,
        totalCents,
        items: { createMany: { data: itemsData } },
      },
      include: { items: true },
    });
  },

  async list(q: ListOrdersQuery) {
    const where: Prisma.OrderWhereInput = q.status ? { status: q.status } : {};
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { items: true },
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  },

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundError('Замовлення не знайдено');
    return order;
  },

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    await this.getById(id);
    return prisma.order.update({
      where: { id },
      data: { status: dto.status as OrderStatus },
      include: { items: true },
    });
  },
};
