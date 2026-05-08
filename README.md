# ☕ Coffee Orders — вебсистема онлайн-замовлень для кав'ярні

[![CI](https://github.com/lazar1n-yt/coffee-orders/actions/workflows/ci.yml/badge.svg)](https://github.com/lazar1n-yt/coffee-orders/actions/workflows/ci.yml)
[![CD](https://github.com/lazar1n-yt/coffee-orders/actions/workflows/cd.yml/badge.svg)](https://github.com/lazar1n-yt/coffee-orders/actions/workflows/cd.yml)
[![CodeQL](https://github.com/lazar1n-yt/coffee-orders/actions/workflows/codeql.yml/badge.svg)](https://github.com/lazar1n-yt/coffee-orders/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-24%20LTS-339933?logo=node.js)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgres-18-336791?logo=postgresql)](https://www.postgresql.org)

> **Coffee Orders** — повноцінне веборієнтоване рішення для приймання й опрацювання
> замовлень у кав'ярні. Складається з REST API на **Express 5 + Prisma** та
> SPA-інтерфейсу на **React 19 + Vite**, повністю контейнеризоване й готове до
> розгортання у production через **Docker Compose** і **GitHub Container Registry**.

---

## Зміст

- [Можливості](#можливості)
- [Технологічний стек](#технологічний-стек)
- [Архітектура](#архітектура)
- [Швидкий старт](#швидкий-старт)
- [Розгортання у Docker](#розгортання-у-docker)
- [Локальна розробка](#локальна-розробка)
- [Структура репозиторію](#структура-репозиторію)
- [Корисні команди (Makefile)](#корисні-команди-makefile)
- [Тестування](#тестування)
- [CI/CD](#cicd)
- [Документація](#документація)
- [Релізи та версіонування](#релізи-та-версіонування)
- [Внесок у проєкт](#внесок-у-проєкт)
- [Ліцензія](#ліцензія)

---

## Можливості

**Для клієнта:**

- Перегляд меню з категоріями, фотографіями та описами страв
- Кошик із розрахунком підсумкової вартості
- Оформлення замовлення з вибором часу самовивозу
- Реєстрація / логін email + пароль або через Google OAuth 2.0
- Особистий кабінет з історією замовлень

**Для адміністратора:**

- CRUD категорій і позицій меню (із завантаженням зображень)
- Стрічка замовлень із фільтрами за статусом
- Зміна статусів замовлень: `PENDING → CONFIRMED → READY → COMPLETED`
- Скасування замовлень із коментарем

**Інфраструктурні:**

- Документація API в OpenAPI 3.1 (Swagger UI на `/api/docs`)
- Healthcheck-ендпоінт `/api/health`
- Структуровані помилки у єдиному форматі
- JWT access + refresh токени, hashing пароля через bcrypt
- Helmet, CORS, обмеження тіла запиту 1 MB

---

## Технологічний стек

| Шар              | Технології                                                       |
|------------------|------------------------------------------------------------------|
| Frontend         | React 19, Vite 7, TypeScript 5, React Router 7, TanStack Query 5, Zustand 5, Axios |
| Backend          | Node.js 24 LTS, Express 5, TypeScript 5, Zod, JWT (jsonwebtoken) |
| База даних       | PostgreSQL 18, Prisma ORM 6                                      |
| Тестування       | Vitest 3, Supertest                                              |
| Документація API | OpenAPI 3.1 + Swagger UI Express                                 |
| Контейнери       | Docker, Docker Compose, multi-stage Alpine images                |
| CI/CD            | GitHub Actions, GitHub Container Registry, Trivy, CodeQL, SLSA provenance |
| Лінтери          | ESLint 9, Prettier 3, typescript-eslint 8                        |

---

## Архітектура

```
┌──────────────┐   HTTPS / JSON    ┌──────────────────┐   TCP/SSL    ┌──────────────┐
│  React SPA   │ ────────────────► │  Express API     │ ──────────►  │ PostgreSQL 18│
│  (nginx:80)  │ ◄──────────────── │  (Node.js 24)    │ ◄──────────  │  (port 5432) │
└──────────────┘                   └────────┬─────────┘              └──────────────┘
                                            │
                                  ┌─────────┴─────────┐
                                  │  /uploads (volume)│
                                  └───────────────────┘
```

Детальні діаграми (use-case, ER-модель, послідовність створення замовлення)
доступні у [docs/TECH_DOCS.md](docs/TECH_DOCS.md).

---

## Швидкий старт

**Передумови:** Docker 24+ та Docker Compose v2.

```bash
# 1. Клонувати репозиторій
git clone https://github.com/lazar1n-yt/coffee-orders.git
cd coffee-orders

# 2. Створити .env (мінімум — JWT-секрети)
cp .env.example .env
# відредагуйте JWT_ACCESS_SECRET / JWT_REFRESH_SECRET

# 3. Підняти весь стек
docker compose up -d --build

# 4. Перевірити здоровʼя сервісів
docker compose ps
curl http://localhost:4000/api/health
```

Після цього доступні:

| URL                                  | Сервіс           |
|--------------------------------------|------------------|
| http://localhost:8080                | Frontend (SPA)   |
| http://localhost:4000/api/health     | Healthcheck API  |
| http://localhost:4000/api/docs       | Swagger UI       |
| postgresql://localhost:5432          | База даних (dev) |

Тестові облікові записи додаються автоматично командою `make seed`
(див. [docs/USER_GUIDE.md](docs/USER_GUIDE.md)).

---

## Розгортання у Docker

Стек складається з трьох сервісів, описаних у [docker-compose.yml](docker-compose.yml):

| Сервіс | Образ                                                        | Порт (host) | Призначення              |
|--------|--------------------------------------------------------------|-------------|--------------------------|
| `db`   | `postgres:18-alpine`                                         | —           | PostgreSQL 18, healthcheck |
| `api`  | `ghcr.io/lazar1n-yt/coffee-orders-backend:latest`            | 4000        | REST API + Swagger       |
| `web`  | `ghcr.io/lazar1n-yt/coffee-orders-frontend:latest`           | 8080        | Vite-білд + nginx        |

Особливості:

- **Multi-stage builds** — фінальні образи мінімальні (Alpine).
- **Non-root** запуск (uid `app`) у backend для compliance з OWASP.
- **Healthchecks** на всіх трьох контейнерах + `start_period` для повільного старту БД.
- **tini** як PID 1 — graceful shutdown за SIGTERM (важливо для k8s/Compose v2).
- **Resource limits** (512 MB / 1 CPU для API, 128 MB / 0.5 CPU для web).
- **Volumes** `db_data` і `uploads_data` зберігають дані між перезапусками.
- **Multi-arch** images — `linux/amd64` і `linux/arm64` (build by CI).

Для production-розгортання за reverse-proxy (Caddy/Traefik/nginx) див.
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Локальна розробка

### Варіант A. Через Docker Compose (рекомендовано)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
# Backend: http://localhost:4000  (hot-reload через tsx watch)
# DB:      localhost:5432
# Frontend запускається ОКРЕМО, через Vite (див. нижче)
```

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Варіант B. Без Docker

**Backend:**

```bash
cd backend
cp .env.example .env       # JWT_*, DATABASE_URL
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev                # http://localhost:4000
```

**Frontend:**

```bash
cd frontend
cp .env.example .env       # VITE_API_BASE_URL
npm install
npm run dev                # http://localhost:5173
```

---

## Структура репозиторію

```
.
├── .github/
│   ├── workflows/        # CI, CD, CodeQL, Trivy
│   ├── ISSUE_TEMPLATE/
│   ├── dependabot.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── backend/              # Express 5 API + Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/      # auth, categories, menu, orders
│   │   ├── utils/
│   │   ├── app.ts
│   │   ├── routes.ts
│   │   ├── server.ts
│   │   └── openapi.yaml
│   ├── tests/
│   ├── Dockerfile        # multi-stage Alpine, non-root
│   └── package.json
├── frontend/             # React 19 + Vite SPA
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/        # Zustand
│   │   └── styles/
│   ├── Dockerfile        # multi-stage → nginx
│   ├── nginx.conf
│   └── package.json
├── docs/
│   ├── USER_GUIDE.md     # інструкція для кінцевого користувача
│   ├── TECH_DOCS.md      # технічна документація
│   ├── DEPLOYMENT.md     # деплой у production
│   └── CONTRIBUTING.md   # настанови для контриб'юторів
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── Makefile
├── CHANGELOG.md
└── README.md
```

---

## Корисні команди (Makefile)

```bash
make help            # повний список цілей
make up              # production-стек: db + api + web
make up-dev          # dev-режим (hot-reload backend)
make down            # зупинити
make logs            # tail логів
make migrate         # застосувати Prisma-міграції
make seed            # засіяти тестові дані
make backend-shell   # sh всередині контейнера API
make db-shell        # psql всередині контейнера БД
make test            # тести обох пакетів
make lint            # ESLint обох пакетів
```

У Windows запускайте `make` через WSL або Git Bash; альтернатива —
викликати `docker compose ...` напряму.

---

## Тестування

| Шар        | Інструменти                  | Команда                  |
|------------|------------------------------|--------------------------|
| Backend    | Vitest + Supertest           | `cd backend && npm test` |
| Frontend   | Vitest + React Testing Library | `cd frontend && npm test` |
| API contract | Swagger UI / cURL          | http://localhost:4000/api/docs |

CI запускає всі тести разом із Postgres-сервісом і завантажує JUnit-звіт
артефактом workflow-у (зберігається 14 днів).

---

## CI/CD

У репозиторії налаштовано **чотири** автоматизовані пайплайни:

### 1. `.github/workflows/ci.yml` — Continuous Integration

Запускається на кожен `push`/`pull_request` у `main`/`develop`.

- **backend job:** сервіс PostgreSQL 18 → `npm ci` → `prisma generate` → `prisma migrate deploy` → ESLint → TypeScript build → Vitest з JUnit-звітом
- **frontend job:** `npm ci` → ESLint → Vitest → `vite build` → артефакт `frontend-dist`
- **summary job:** блокує merge, якщо щось упало

### 2. `.github/workflows/cd.yml` — Continuous Delivery

Запускається на `push` у `main` і на теги `v*.*.*`.

- Multi-arch build (amd64 + arm64) через **Docker Buildx + QEMU**
- Push у **GitHub Container Registry** (`ghcr.io`)
- **SLSA build provenance attestation** (`actions/attest-build-provenance@v2`)
- **SBOM** (Software Bill of Materials) генерується Buildx
- **Trivy image scan** з upload SARIF у Code Scanning
- Автоматичне створення **GitHub Release** на семантичних тегах

### 3. `.github/workflows/codeql.yml` — статичний аналіз

GitHub-нативний CodeQL для `javascript-typescript` і `actions`,
запит-сюїт `security-and-quality`. Розклад: щопонеділка о 03:17 UTC.

### 4. `.github/workflows/trivy.yml` — сканування файлової системи

Trivy filesystem scan з upload SARIF у вкладку Security.

### Dependabot

`.github/dependabot.yml` слідкує за npm (backend, frontend), GitHub Actions
і Docker base images. PR-и групуються (prod / dev) і відкриваються
щопонеділка вранці за київським часом.

---

## Документація

| Документ                                                | Аудиторія         |
|---------------------------------------------------------|-------------------|
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md)                | Кінцеві користувачі (клієнт + адмін) |
| [docs/TECH_DOCS.md](docs/TECH_DOCS.md)                  | Розробники, інтегратори |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)                | DevOps, системні адміністратори |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)            | Зовнішні контриб'ютори |
| [backend/src/openapi.yaml](backend/src/openapi.yaml)    | Інтегратори API   |
| [CHANGELOG.md](CHANGELOG.md)                            | Усі зацікавлені   |

---

## Релізи та версіонування

Проєкт використовує **Semantic Versioning (SemVer 2.0)**:

- `MAJOR` — несумісні зміни API
- `MINOR` — нові функції, сумісні назад
- `PATCH` — багфікси

Релізи створюються автоматично з тегу `vX.Y.Z` через CD-пайплайн.
Поточна стабільна версія: **v1.0.0** (див. [CHANGELOG.md](CHANGELOG.md)).

```bash
git tag -a v1.1.0 -m "release: v1.1.0"
git push origin v1.1.0          # CD створить GitHub Release і запушить образи
```

---

## Внесок у проєкт

Перед відкриттям PR ознайомтеся з [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).
Коротко:

1. Гілка з префіксом `feat/`, `fix/`, `chore/`.
2. Commit-повідомлення у стилі **Conventional Commits**.
3. Усі CI-перевірки мають бути зеленими.
4. PR-шаблон обов'язковий до заповнення.

---

## Ліцензія

Проєкт поширюється на умовах ліцензії **MIT**. Деталі — у файлі [LICENSE](LICENSE).

---

**Автор:** [@lazar1n-yt](https://github.com/lazar1n-yt) ·
**Керівник практики:** Владислав СОРОКОПУД (ТОВ «Фаховий передвищий коледж «ОПТІМА»)
