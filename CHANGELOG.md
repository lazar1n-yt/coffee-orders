# Changelog

Усі помітні зміни цього проєкту фіксуються в цьому файлі.
Формат базується на [Keep a Changelog](https://keepachangelog.com/uk/1.1.0/),
проєкт використовує [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-05-09

Перший стабільний реліз MVP «Coffee Orders».

### Додано
- **Backend** (`backend/`): Node.js 22 + Express 5 + Prisma 6 + PostgreSQL 18.
  - Модулі `auth`, `categories`, `menu`, `orders` із розшаруванням
    `router → controller → service → schema`.
  - JWT-автентифікація (access 15 хв + refresh 30 днів), хешування
    паролів через Argon2id.
  - Валідація вхідних даних через Zod.
  - Health-check `GET /api/health`, OpenAPI 3.1 у `src/openapi.yaml`.
  - Інтеграційні та модульні тести на Vitest + Supertest.
  - Docker Compose для локальної PostgreSQL та production-Dockerfile.
- **Frontend** (`frontend/`): React 19 + Vite 7 + TypeScript 5.9.
  - Сторінки: меню, кошик, реєстрація, вхід, адмін-замовлення, 404.
  - Стан: TanStack Query 5 (серверний), Zustand 5 (клієнтський).
  - Маршрутизація через React Router 7, типобезпечний API-клієнт.
- **Документація**:
  - Звіти з практичних робіт № 1, 5, 9, 10, 16, 18, 32
    (формат `.docx`, ДСТУ 3008:2015).
  - Інструкція для кінцевого користувача
    (`Інструкція_користувача_Coffee_Orders.docx`).
  - Діаграма архітектури системи (`architecture_diagram.png`).
- **Інфраструктура**:
  - `.gitignore`, `README.md`, угоди про комміти (Conventional Commits).
  - Скрипти-генератори звітів на python-docx.

### Функціональність релізу
- Перегляд меню з фільтром за категоріями та пагінацією.
- Кошик і оформлення замовлення (доступне і анонімному, і
  авторизованому користувачу).
- Особистий кабінет адміністратора: керування меню, категоріями
  та статусами замовлень
  (`PENDING → CONFIRMED → READY → COMPLETED`, термінальний
  статус `CANCELLED`).

### Безпека
- Argon2id для паролів, окремі секрети для access/refresh токенів.
- CORS обмежено `CORS_ORIGIN`, валідація всіх вхідних даних.
- Rate-limit для `/api/auth/*` через `express-rate-limit`.

[1.0.0]: https://github.com/lazar1n-yt/coffee-orders/releases/tag/v1.0.0
