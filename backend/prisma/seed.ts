/**
 * Заповнення бази даних демонстраційними даними.
 * Запуск: npm run prisma:seed
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // --- Адміністратор ---
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@coffee.local' },
    update: {},
    create: {
      email: 'admin@coffee.local',
      passwordHash: adminPassword,
      fullName: 'Адміністратор кав’ярні',
      role: Role.ADMIN,
    },
  });

  // --- Категорії ---
  const coffee = await prisma.category.upsert({
    where: { slug: 'coffee' },
    update: {},
    create: { name: 'Кава', slug: 'coffee', position: 1 },
  });
  const tea = await prisma.category.upsert({
    where: { slug: 'tea' },
    update: {},
    create: { name: 'Чай', slug: 'tea', position: 2 },
  });
  const desserts = await prisma.category.upsert({
    where: { slug: 'desserts' },
    update: {},
    create: { name: 'Десерти', slug: 'desserts', position: 3 },
  });

  // --- Позиції меню ---
  const items = [
    { name: 'Еспресо', priceCents: 4500, categoryId: coffee.id,
      description: 'Класичне еспресо 30 мл' },
    { name: 'Капучино', priceCents: 7500, categoryId: coffee.id,
      description: 'Еспресо з молочною пінкою, 250 мл' },
    { name: 'Лате', priceCents: 8500, categoryId: coffee.id,
      description: 'М’який лате на цільному молоці, 300 мл' },
    { name: 'Чай зелений', priceCents: 5500, categoryId: tea.id,
      description: 'Сенча, 400 мл' },
    { name: 'Чай чорний', priceCents: 5500, categoryId: tea.id,
      description: 'Цейлонський, 400 мл' },
    { name: 'Чізкейк', priceCents: 9500, categoryId: desserts.id,
      description: 'Класичний Нью-Йорк' },
    { name: 'Круасан', priceCents: 6500, categoryId: desserts.id,
      description: 'Свіжий круасан з вершковим маслом' },
  ];

  for (const it of items) {
    await prisma.menuItem.upsert({
      where: { id: it.name },
      update: {},
      create: it,
    }).catch(async () => {
      await prisma.menuItem.create({ data: it });
    });
  }

  console.log('Seed: готово.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
