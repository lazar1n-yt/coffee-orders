# Технічна документація · Coffee Orders

> Документ призначений для **розробників, інтеграторів та DevOps-інженерів**,
> що працюють із кодовою базою або інтегруються з API системи Coffee Orders.

---

## Зміст

1. [Огляд системи](#1-огляд-системи)
2. [Архітектура](#2-архітектура)
3. [Модель даних](#3-модель-даних)
4. [REST API](#4-rest-api)
5. [Автентифікація та авторизація](#5-автентифікація-та-авторизація)
6. [Безпека](#6-безпека)
7. [Стек технологій і версії](#7-стек-технологій-і-версії)
8. [Структура коду](#8-структура-коду)
9. [Конвенції розробки](#9-конвенції-розробки)
10. [Тестування](#10-тестування)
11. [Спостережуваність (observability)](#11-спостережуваність)
12. [Глосарій](#12-глосарій)

---

## 1. Огляд системи

Coffee Orders — це **трирівнева клієнт-серверна** вебсистема:

- **Презентаційний шар** — SPA (React 19 + Vite), віддається статично з nginx.
- **Прикладний шар** — REST API (Express 5 + TypeScript), модульна архітектура router → controller → service.
- **Шар даних** — PostgreSQL 18 із доступом через Prisma ORM 6.

Розгортання — Docker Compose (development і production), CI/CD — GitHub Actions з push у GHCR.

---

## 2. Архітектура

### 2.1. Загальна схема

```
┌──────────────┐    HTTPS / JSON    ┌──────────────────┐    TCP / SSL     ┌──────────────┐
│  React SPA   │ ─────────────────► │  Express 5 API   │ ──────────────►  │ PostgreSQL 18│
│  nginx :80   │ ◄───────────────── │  Node.js 24 LTS  │ ◄──────────────  │  port 5432   │
└──────────────┘                    └────────┬─────────┘                  └──────────────┘
                                             │
                                  ┌──────────┴──────────┐
                                  │  /uploads (volume)  │ — статичні файли (зображення меню)
                                  └─────────────────────┘
```

### 2.2. Шари backend-додатка

```
HTTP Request
   │
   ▼
[Express Router]               // src/routes.ts + src/modules/*/router.ts
   │
   ▼
[Middleware]                    // helmet, cors, json(), morgan, requireAuth, requireRole
   │
   ▼
[Controller]                    // src/modules/<x>/controller.ts — HTTP-частина
   │  • парсинг параметрів
   │  • виклик validate(zodSchema)
   │  • виклик service-методу
   │  • формування response
   ▼
[Service]                       // src/modules/<x>/service.ts — бізнес-логіка
   │  • перевірки інваріантів
   │  • робота з Prisma
   │  • формування доменних помилок
   ▼
[Prisma Client]                 // typed query builder → PostgreSQL
```

Будь-яка непередбачена помилка перехоплюється `errorHandler`-middleware і
повертається у єдиному форматі (див. § 4).

### 2.3. Послідовність створення замовлення

```
Client → POST /api/orders {items, pickupTime}
        ─► Router (express)
            ─► validate(createOrderSchema)            // Zod
                ─► OrdersController.create
                    ─► OrdersService.createOrder()
                        ─► prisma.menuItem.findMany   // перевірка наявності й цін
                        ─► prisma.$transaction:
                              prisma.order.create + prisma.orderItem.createMany
                        ─► return order
                    ─► res.status(201).json(order)
```

---

## 3. Модель даних

Prisma schema розташована у `backend/prisma/schema.prisma`.

| Сутність    | Призначення                                          |
|-------------|-------------------------------------------------------|
| `User`      | користувач (CUSTOMER або ADMIN), email унікальний; OAuth-зв'язки через `oauthProvider+oauthId` |
| `Category`  | категорія меню (`name`, `slug` унікальні; `position` для порядку) |
| `MenuItem`  | позиція меню; ціна в копійках (Int) для уникнення помилок округлення |
| `Order`     | замовлення; `number` — autoincrement-послідовність для відображення клієнту |
| `OrderItem` | склад замовлення; містить `nameSnapshot` і `priceCents` на момент замовлення (immutable history) |

Enum `OrderStatus`: `PENDING | CONFIRMED | READY | COMPLETED | CANCELLED`.

**Індекси:**

- `User(oauthProvider, oauthId)` — для швидкого пошуку OAuth-користувачів.
- `MenuItem(categoryId, available)` — для лістингу меню за категоріями.
- `Order(status, createdAt)` — для адмін-стрічки.
- `OrderItem(orderId)` — fk-індекс для join-ів.

**Міграції:** `npx prisma migrate dev` (локально) і `prisma migrate deploy` (production, у CI/CD та entrypoint контейнера).

---

## 4. REST API

### 4.1. Базова інформація

- Базовий URL: `https://<host>/api`.
- Формат запиту/відповіді: `application/json; charset=utf-8`.
- Версіювання: через major-тег у репозиторії; breaking changes — лише зі зміною major-версії.
- OpenAPI-специфікація: [backend/src/openapi.yaml](../backend/src/openapi.yaml).
- Swagger UI: `/api/docs`.

### 4.2. Формат успішної відповіді

```json
{
  "id": "8a2e3...",
  "number": 42,
  "status": "PENDING",
  "items": [...]
}
```

### 4.3. Формат помилки

Усі помилки уніфіковано:

```json
{
  "error": {
    "code":    "VALIDATION_ERROR",
    "message": "Тіло запиту не пройшло валідацію",
    "details": [
      { "path": ["items", 0, "quantity"], "message": "Number must be >= 1" }
    ]
  }
}
```

Можливі коди:

| HTTP | code                  | Коли виникає                              |
|------|------------------------|--------------------------------------------|
| 400  | `VALIDATION_ERROR`     | Zod-валідація провалилась                  |
| 401  | `UNAUTHORIZED`         | відсутній / прострочений access-токен      |
| 403  | `FORBIDDEN`            | користувач без потрібної ролі              |
| 404  | `NOT_FOUND`            | ресурс не знайдено                         |
| 409  | `CONFLICT`             | порушено унікальність / бізнес-інваріант   |
| 422  | `BUSINESS_RULE`        | напр., страва недоступна, сума 0           |
| 500  | `INTERNAL`             | непередбачена помилка                      |

### 4.4. Перелік ендпоінтів

#### Auth

| Метод | Шлях                  | Опис                                      |
|-------|-----------------------|--------------------------------------------|
| POST  | `/auth/register`      | реєстрація email+пароль                    |
| POST  | `/auth/login`         | логін email+пароль                         |
| POST  | `/auth/refresh`       | оновлення пари токенів                     |
| POST  | `/auth/logout`        | відкликання refresh-токена                 |
| GET   | `/auth/me`            | поточний користувач                        |
| GET   | `/auth/oauth/google`  | початок OAuth-флоу                         |
| GET   | `/auth/oauth/callback`| callback від Google                        |

#### Categories (admin для write)

| Метод  | Шлях                  | Роль  |
|--------|-----------------------|-------|
| GET    | `/categories`         | будь-хто |
| POST   | `/categories`         | ADMIN |
| PATCH  | `/categories/:id`     | ADMIN |
| DELETE | `/categories/:id`     | ADMIN |

#### Menu (admin для write)

| Метод  | Шлях                  | Роль  |
|--------|-----------------------|-------|
| GET    | `/menu/items`         | будь-хто (фільтри `categoryId`, `available`, `page`, `pageSize`) |
| GET    | `/menu/items/:id`     | будь-хто |
| POST   | `/menu/items`         | ADMIN, multipart/form-data із полем `image` |
| PATCH  | `/menu/items/:id`     | ADMIN |
| DELETE | `/menu/items/:id`     | ADMIN |

#### Orders

| Метод  | Шлях                       | Роль                  |
|--------|----------------------------|------------------------|
| POST   | `/orders`                  | будь-хто (гість або клієнт) |
| GET    | `/orders/me`               | CUSTOMER (своя історія) |
| GET    | `/orders`                  | ADMIN (фільтри статусу) |
| GET    | `/orders/:id`              | ADMIN або власник      |
| PATCH  | `/orders/:id/status`       | ADMIN                  |

#### Системні

| Метод | Шлях             | Опис                      |
|-------|------------------|---------------------------|
| GET   | `/health`        | healthcheck               |
| GET   | `/docs`          | Swagger UI (HTML)         |

### 4.5. Приклад: створення замовлення

```http
POST /api/orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "customerName": "Олена",
  "phone": "+380501112233",
  "pickupTime": "2026-05-09T14:30:00.000Z",
  "comment": "Без цукру",
  "items": [
    { "menuItemId": "9f0e...", "quantity": 2 },
    { "menuItemId": "5b1a...", "quantity": 1 }
  ]
}
```

Відповідь:

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id":          "8a2e3f00-...",
  "number":      42,
  "status":      "PENDING",
  "totalCents":  17500,
  "pickupTime":  "2026-05-09T14:30:00.000Z",
  "items":       [...]
}
```

---

## 5. Автентифікація та авторизація

- Алгоритм: **JWT** (HS256, ключі з env).
- Токени:
  - **access** — TTL 15 хв, передається у `Authorization: Bearer <token>`.
  - **refresh** — TTL 7 днів, передається у `Set-Cookie` (`HttpOnly; Secure; SameSite=Lax`).
- Refresh видається через `POST /auth/refresh`; на logout інвалідовано в БД (`tokenJti` blacklist).
- OAuth: підтримується **Google OAuth 2.0**; `oauthProvider="google"` + `oauthId` зберігаються у `User`.
- Ролі:
  - `CUSTOMER` — за замовчуванням, доступ до власних замовлень;
  - `ADMIN` — повний доступ до адмін-ресурсів.
- Middleware:
  - `requireAuth` — перевірка access-токена;
  - `requireRole('ADMIN')` — перевірка ролі.

```ts
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new UnauthorizedError();
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: Role };
  req.user = payload;
  next();
};
```

---

## 6. Безпека

| Контроль                | Реалізація                                                      |
|-------------------------|------------------------------------------------------------------|
| Заголовки безпеки       | `helmet()` у Express + статичні `add_header` у nginx (frontend) |
| CORS                    | allow-list `CORS_ORIGIN` (env)                                   |
| Розмір тіла запиту      | `express.json({ limit: '1mb' })`                                 |
| Парольний хеш           | `bcrypt`, salt rounds = 10                                       |
| Rate limit (план)       | `express-rate-limit` на v1.1.0                                   |
| OWASP Top 10            | див. чек-лист у [DEPLOYMENT.md](DEPLOYMENT.md)                   |
| Аудит залежностей       | `npm audit`, Dependabot, Trivy FS scan, Trivy image scan, CodeQL |
| SLSA провенанс          | `actions/attest-build-provenance@v2` у CD                        |
| SBOM                    | згенеровано Buildx (`sbom: true`)                                |
| Контейнер non-root      | uid `app` у backend; nginx у frontend                            |
| Secrets management      | env-змінні; у production — Docker secrets або zewnęt. KMS        |

---

## 7. Стек технологій і версії

### Backend (`backend/package.json`)

| Пакет                  | Версія    | Призначення                |
|------------------------|-----------|----------------------------|
| express                | ^5.0.1    | HTTP-фреймворк              |
| @prisma/client         | ^6.4.0    | ORM-клієнт                  |
| prisma                 | ^6.4.0    | CLI-міграції                |
| zod                    | ^3.23.8   | валідація                   |
| jsonwebtoken           | ^9.0.2    | JWT                         |
| bcrypt                 | ^5.1.1    | хешування паролів           |
| helmet                 | ^8.0.0    | заголовки безпеки           |
| cors                   | ^2.8.5    | CORS                        |
| morgan                 | ^1.10.0   | логування HTTP              |
| swagger-ui-express     | ^5.0.1    | Swagger UI                  |
| multer                 | ^1.4.5    | завантаження файлів         |
| nodemailer             | ^6.9.16   | email                       |
| typescript             | ^5.9.0    | мова                        |
| tsx                    | ^4.19.2   | dev-runner                  |
| vitest                 | ^3.0.0    | тестовий фреймворк          |
| supertest              | ^7.0.0    | HTTP-тести                  |
| eslint                 | ^9.16.0   | лінтер                      |

### Frontend (`frontend/package.json`)

| Пакет                  | Версія    | Призначення                |
|------------------------|-----------|----------------------------|
| react                  | ^19.2.0   | UI-фреймворк                |
| react-dom              | ^19.2.0   | рендеринг                   |
| react-router-dom       | ^7.0.0    | маршрутизація               |
| @tanstack/react-query  | ^5.59.0   | серверний стан              |
| zustand                | ^5.0.0    | локальний стан              |
| axios                  | ^1.7.7    | HTTP-клієнт                 |
| vite                   | ^7.0.0    | bundler/devserver           |
| typescript             | ^5.9.0    | мова                        |
| vitest                 | ^3.0.0    | тестування                  |
| eslint                 | ^9.16.0   | лінтер                      |

### Інфраструктура

- Docker Engine 24+, Docker Compose v2.
- PostgreSQL 18-alpine.
- nginx 1.27-alpine.
- Node.js 24 LTS (Alpine).

---

## 8. Структура коду

### Backend

```
backend/
├── prisma/
│   ├── schema.prisma          # модель даних (Single Source of Truth)
│   └── seed.ts                # початкові дані
├── src/
│   ├── config/                # env, prisma client
│   ├── middleware/            # error-handler, requireAuth, requireRole, validate
│   ├── modules/
│   │   ├── auth/              # router + controller + service + schemas
│   │   ├── categories/
│   │   ├── menu/
│   │   └── orders/
│   ├── utils/                 # errors, logger, hashing
│   ├── app.ts                 # createApp() — Express factory
│   ├── routes.ts              # apiRouter
│   ├── server.ts              # listen()
│   └── openapi.yaml           # OpenAPI 3.1
├── tests/
└── Dockerfile
```

### Frontend

```
frontend/
├── public/                    # статика (favicon, robots.txt)
├── src/
│   ├── api/                   # axios instance + REST-функції
│   ├── components/            # дрібні переюзабельні UI-компоненти
│   ├── pages/                 # повноекранні маршрути
│   ├── store/                 # Zustand-сторі (auth, cart)
│   ├── styles/                # global styles + CSS variables
│   ├── utils/                 # хелпери (форматування цін, дат)
│   ├── App.tsx
│   └── main.tsx
├── nginx.conf
└── Dockerfile
```

---

## 9. Конвенції розробки

### 9.1. Гілки

- `main` — захищена; merge лише через PR із зеленим CI.
- `develop` — інтеграційна.
- Гілки фіч: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.

### 9.2. Commit-повідомлення

Conventional Commits:

```
feat(orders): add cancellation reason
fix(auth): refresh token rotation race
chore(deps): bump prisma to 6.4.1
docs(readme): update deployment section
```

### 9.3. Стиль коду

- TypeScript `strict: true`.
- ESLint конфіг розширює `eslint:recommended`, `plugin:@typescript-eslint/recommended`,
  на frontend — `plugin:react-hooks/recommended`.
- Prettier — 2 пробіли, single quotes, semicolons.
- Імпорти впорядковано за `eslint-plugin-import`.

### 9.4. Іменування

- Файли — `kebab-case` (`order-controller.ts`).
- Експортовані типи й класи — `PascalCase`.
- Функції, змінні — `camelCase`.
- Константи env — `UPPER_SNAKE_CASE`.

---

## 10. Тестування

### 10.1. Backend (Vitest + Supertest)

```ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('GET /api/health', () => {
  it('повертає ok', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
```

Команди:

```bash
cd backend
npm test                 # одноразово
npm run test:watch       # у режимі watch
```

### 10.2. Frontend (Vitest + RTL)

```bash
cd frontend
npm test
```

Покриваються: рендеринг сторінок, поведінка форм, валідація, інтеграція з mock API через `msw`.

### 10.3. Цільові метрики

| Метрика                            | Поріг (v1.0) | Цільовий (v1.1) |
|------------------------------------|--------------|------------------|
| Lines coverage backend             | 60 %         | 80 %             |
| Lines coverage frontend            | 50 %         | 70 %             |
| Час прогону CI                     | < 5 хв       | < 4 хв           |

---

## 11. Спостережуваність

- **Логи:** `morgan('dev')` у dev, `morgan('combined')` у production. Формат — JSON через `pino` (план v1.1).
- **Метрики:** ендпоінт `/metrics` у форматі Prometheus (план v1.1).
- **Healthcheck:** `GET /api/health` повертає `{ status, timestamp }`.
- **Container healthcheck:** Docker `HEALTHCHECK` у backend і frontend.
- **Tracing:** OpenTelemetry-агент (план v1.2).

---

## 12. Глосарій

| Термін | Означення                                                           |
|--------|----------------------------------------------------------------------|
| SPA    | Single Page Application — односторінковий вебзастосунок             |
| ORM    | Object-Relational Mapping (тут — Prisma)                             |
| JWT    | JSON Web Token (RFC 7519)                                            |
| OAuth  | Open Authorization (тут — Google OAuth 2.0)                          |
| CI     | Continuous Integration                                               |
| CD     | Continuous Delivery / Deployment                                     |
| GHCR   | GitHub Container Registry (`ghcr.io`)                                |
| SBOM   | Software Bill of Materials                                           |
| SLSA   | Supply-chain Levels for Software Artifacts                           |
| MoSCoW | Must / Should / Could / Won't have — техніка пріоритезації           |
| WCAG   | Web Content Accessibility Guidelines                                 |
