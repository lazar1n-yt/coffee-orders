# Coffee Orders Backend

Серверна частина (REST API) для проєкту **«Вебсистема онлайн-замовлень у кав’ярні»**.

## Стек

- **Node.js 24 LTS «Krypton»**, **TypeScript 5.9**
- **Express 5** — REST API
- **PostgreSQL 18** + **Prisma 6** (ORM, міграції)
- **Zod** — валідація вхідних даних
- **JWT** (access + refresh) — автентифікація
- **Helmet**, **CORS**, **Morgan** — безпека та логування
- **Swagger UI / OpenAPI 3.1** — документація API
- **Vitest 3** + **Supertest** — тестування
- **ESLint 9 + Prettier 3** — якість і стиль коду
- **Docker + Docker Compose** — інфраструктура

## Структура проєкту

```
backend/
├── prisma/
│   ├── schema.prisma         # схема БД
│   └── seed.ts               # початкові дані
├── src/
│   ├── config/               # конфігурація (env, prisma)
│   ├── middleware/           # auth, validate, error-handler
│   ├── modules/              # бізнес-модулі (auth, menu, categories, orders)
│   │   └── <module>/
│   │       ├── *.router.ts
│   │       ├── *.controller.ts
│   │       ├── *.service.ts
│   │       └── *.schema.ts
│   ├── utils/                # допоміжні утиліти
│   ├── openapi.yaml          # специфікація API
│   ├── routes.ts             # точка збору всіх роутерів
│   ├── app.ts                # створення Express-застосунку
│   └── server.ts             # точка входу
├── tests/                    # Vitest-тести
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Швидкий старт

### Через Docker Compose (рекомендовано)

```powershell
# 1. Скопіюйте змінні
Copy-Item .env.example .env

# 2. Підніміть стек
docker compose up -d --build

# 3. Виконайте міграції та сід
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run prisma:seed
```

API доступне на http://localhost:4000/api , документація — на http://localhost:4000/api/docs .

### Локально

```powershell
npm install
Copy-Item .env.example .env
# відредагуйте DATABASE_URL для локальної PostgreSQL
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

## Основні ендпоінти

| Метод | URL | Опис | Доступ |
|---|---|---|---|
| GET | `/api/health` | Health-check | публічний |
| POST | `/api/auth/register` | Реєстрація клієнта | публічний |
| POST | `/api/auth/login` | Вхід | публічний |
| POST | `/api/auth/refresh` | Оновлення токенів | публічний |
| GET  | `/api/auth/me` | Поточний користувач | авторизовано |
| GET  | `/api/categories` | Список категорій | публічний |
| POST | `/api/categories` | Створити категорію | ADMIN |
| PATCH/DELETE | `/api/categories/:id` | Редагувати/видалити | ADMIN |
| GET  | `/api/menu` | Перелік позицій (фільтри) | публічний |
| GET  | `/api/menu/:id` | Деталі позиції | публічний |
| POST/PATCH/DELETE | `/api/menu` | Керування меню | ADMIN |
| POST | `/api/orders` | Створити замовлення | публічний |
| GET  | `/api/orders` | Список (з пагінацією) | ADMIN |
| GET  | `/api/orders/:id` | Деталі замовлення | ADMIN |
| PATCH | `/api/orders/:id/status` | Змінити статус | ADMIN |

## Тестові дані

Після `npm run prisma:seed`:

- **admin** — `admin@coffee.local` / `admin123`
- 3 категорії, 7 позицій меню.

## Команди

| Команда | Призначення |
|---|---|
| `npm run dev` | Запуск у режимі розробки (tsx watch) |
| `npm run build` | Збірка TypeScript у `dist/` |
| `npm start` | Запуск зібраного коду |
| `npm test` | Запуск Vitest-тестів |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run prisma:migrate` | Створення/застосування міграції |
| `npm run prisma:seed` | Заповнення БД демоданими |
