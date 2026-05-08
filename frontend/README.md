# Coffee Orders Frontend

Клієнтська частина (SPA) проєкту **«Вебсистема онлайн-замовлень у кав’ярні»**.

## Стек

- **React 19.2** + **TypeScript 5.9**
- **Vite 7** — збірник і dev-сервер з HMR
- **React Router 7** — маршрутизація
- **TanStack Query 5** — кешування серверних даних, стани (loading/error/success)
- **Axios** — HTTP-клієнт із перехопленням помилок
- **Zustand** — локальний клієнтський стан (auth, cart) із персистом у `localStorage`
- **ESLint 9 + Prettier 3** — якість коду

## Структура

```
frontend/
├── public/
├── src/
│   ├── api/                # axios-клієнт + типи + ендпоінти
│   ├── components/         # перевикористовувані UI-компоненти
│   ├── pages/              # екрани застосунку
│   ├── store/              # zustand-стори (auth, cart)
│   ├── styles/             # глобальні стилі (CSS)
│   ├── utils/              # формати ціни, дати, статусів
│   ├── App.tsx             # маршрути
│   └── main.tsx            # точка входу
├── index.html
├── vite.config.ts          # проксі /api → http://localhost:4000
└── tsconfig.json
```

## Реалізовані екрани

| Маршрут | Призначення | Доступ |
|---|---|---|
| `/` | Меню (фільтр за категоріями, додавання у кошик) | публічний |
| `/cart` | Кошик + форма оформлення замовлення | публічний |
| `/login` | Вхід (email + пароль) | публічний |
| `/register` | Реєстрація клієнта | публічний |
| `/admin/orders` | Адмін-панель: список замовлень + зміна статусу | ADMIN |

## Запуск

```powershell
# 1. Запустіть бекенд:
cd ..\backend
docker compose up -d
npm run prisma:seed

# 2. Запустіть фронтенд:
cd ..\frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Застосунок доступний на http://localhost:5173 (запити `/api/*` проксіюються до бекенду на `:4000`).

## Скрипти

| Команда | Призначення |
|---|---|
| `npm run dev` | Dev-сервер з HMR |
| `npm run build` | Production-збірка у `dist/` |
| `npm run preview` | Локальний перегляд production-збірки |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm test` | Vitest |

## Адаптивність

CSS-сітки використовують `auto-fill` + `minmax`, що автоматично адаптує кількість колонок до ширини екрана. Окремий media-query для ≤640px спрощує шапку та реорганізовує рядки кошика.
