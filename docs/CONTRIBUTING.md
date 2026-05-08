# Як долучитися до Coffee Orders

Дякуємо за інтерес до проєкту! Цей документ описує робочий процес,
конвенції коду й вимоги до Pull Request-ів.

---

## Зміст

1. [Кодекс поведінки](#1-кодекс-поведінки)
2. [Як повідомити про ваду](#2-як-повідомити-про-ваду)
3. [Як запропонувати фічу](#3-як-запропонувати-фічу)
4. [Налаштування dev-середовища](#4-налаштування-dev-середовища)
5. [Робочий процес Git](#5-робочий-процес-git)
6. [Правила Pull Request](#6-правила-pull-request)
7. [Конвенції коду](#7-конвенції-коду)
8. [Тести](#8-тести)
9. [Чек-лист перед merge](#9-чек-лист-перед-merge)

---

## 1. Кодекс поведінки

Проєкт дотримується принципів [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
Поведінка, що порушує ці принципи (зокрема дискримінація, харасмент, образи),
тягне за собою блокування у репозиторії.

---

## 2. Як повідомити про ваду

1. Перевірте, що цю ваду ще ніхто не задокументував у [Issues](https://github.com/lazar1n-yt/coffee-orders/issues).
2. Створіть нове issue, обравши шаблон **«🐞 Звіт про ваду»**.
3. Опишіть кроки відтворення, очікувану й фактичну поведінку, версію, скріншоти/логи.

> **Безпекові вади** не публікуйте у відкритих issues. Надсилайте на
> `security@example.com` з префіксом `[SECURITY]` у темі. Ми відповімо
> протягом 72 годин і узгодимо процес responsible disclosure.

---

## 3. Як запропонувати фічу

1. Створіть issue за шаблоном **«✨ Пропозиція фічі»**.
2. Опишіть проблему, яку розв'язує фіча (а не лише саме рішення).
3. Окресліть user-story у форматі: «Як <роль>, я хочу <дію>, щоби <вигоду>».
4. Дочекайтеся відгуку метейнерів перед написанням коду — щоб уникнути
   паралельної роботи й узгодити архітектуру.

---

## 4. Налаштування dev-середовища

### Передумови

- Node.js 24 LTS, npm 10+.
- Docker Engine 24+ (для бази даних, опційно повний стек).
- Git 2.40+.

### Кроки

```bash
git clone https://github.com/lazar1n-yt/coffee-orders.git
cd coffee-orders

# Backend
cd backend
cp .env.example .env       # за потреби відредагуйте
npm ci
docker compose -f ../docker-compose.yml -f ../docker-compose.dev.yml up -d db
npx prisma migrate dev
npm run dev

# Frontend (в іншому терміналі)
cd ../frontend
cp .env.example .env
npm ci
npm run dev
```

Перевірка:

- API → http://localhost:4000/api/health
- Web → http://localhost:5173
- Swagger → http://localhost:4000/api/docs

---

## 5. Робочий процес Git

### Гілки

- `main` — захищена; стабільна версія, що збігається з останнім тегом.
- `develop` — інтеграційна гілка; усі feature-гілки зливаються сюди.
- Робочі гілки створюються від `develop` за схемою:
  - `feat/<ticket>-<short-desc>` — нова функціональність;
  - `fix/<ticket>-<short-desc>` — виправлення вади;
  - `chore/<short-desc>` — рутинні зміни (deps, конфіги);
  - `docs/<short-desc>` — лише документація;
  - `refactor/<short-desc>` — рефакторинг без зміни поведінки;
  - `test/<short-desc>` — лише тести.

### Commit-повідомлення

Використовуємо [Conventional Commits 1.0.0](https://www.conventionalcommits.org/uk/v1.0.0/):

```
<type>(<scope>): <короткий опис у наказовій формі, малими літерами>

<необов'язкове тіло — пояснює «чому», не «що»>

<необов'язковий футер — BREAKING CHANGE: ...; Refs #42>
```

Приклади:

```
feat(orders): підтримка скасування з причиною
fix(auth): запобігти race-condition у refresh
chore(deps): bump prisma to 6.4.1
docs(readme): додати розділ деплою
refactor(menu): розділити service на queries і commands
```

`<type>` — один із: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `style`.

### Rebase, не merge

Перед відкриттям PR підтягніть актуальний `develop`:

```bash
git fetch origin
git rebase origin/develop
```

Це утримує лінійну історію.

---

## 6. Правила Pull Request

1. PR відкривається з `feat/...` (або іншої робочої гілки) у `develop`.
2. Заповніть шаблон PR (опис, скріншоти UI, чек-лист).
3. PR має складатися з логічно завершених commit-ів. Великі PR (> 600 рядків
   diff) рекомендовано розбивати.
4. У заголовку PR використовуйте Conventional Commit (так само, як для
   commit-у), наприклад: `feat(menu): drag-n-drop для категорій`.
5. PR-mergement-стратегія: **squash and merge** для коротких feature-ів,
   **rebase and merge** для серії підготовлених commit-ів.
6. Зелений CI — обов'язково. Без нього PR не мерджиться.
7. Мінімум **1 апрув** від метейнера. Для security/db-міграцій — 2 апрува.
8. Для змін, що зачіпають публічний API, додайте запис до `CHANGELOG.md`.

---

## 7. Конвенції коду

- **TypeScript strict-mode** обов'язковий; `any` дозволено лише з коментарем-обґрунтуванням.
- **ESLint** не повинен давати ані помилок, ані попереджень: `npm run lint`.
- **Prettier** — автоматичне форматування при збереженні (`.editorconfig`/VS Code settings включені у репо).
- **Імпорти** впорядковані; не використовуйте відносні шляхи з `../../../..` —
  переходьте на TS path-aliases (`@/...`).
- **Іменування файлів** — `kebab-case`. Винятки: компоненти React (`PascalCase.tsx`).
- **Доменні помилки** кидаємо через `AppError` (`backend/src/utils/errors.ts`),
  щоб `errorHandler` правильно сформував відповідь.
- **Коментарі** — лише там, де код неочевидний. Коментар відповідає на
  питання «чому», а не «що».
- **JSDoc** — для публічних функцій модулів (експортовані з модуля).

### Frontend-специфічне

- Використовувати функціональні компоненти й хуки.
- Серверний стан — TanStack Query, локальний — Zustand. Не змішуйте.
- Селектори Zustand — `useStore(s => s.field)`, не `useStore()` без селектора.
- CSS — CSS Modules або Tailwind utility-first (на вибір модуля).

---

## 8. Тести

- Кожна нова функція/правка → тест.
- Backend: `npm test` (Vitest + Supertest); файли — `tests/**/*.test.ts`.
- Frontend: `npm test` (Vitest + Testing Library); файли — `**/*.test.tsx`.
- Інтеграційні тести БД використовують окрему БД у Postgres-сервісі CI.
- Покриття не повинно знижуватися нижче від поточного.

Запуск локально перед PR:

```bash
cd backend  && npm run lint && npm test
cd frontend && npm run lint && npm test && npm run build
```

---

## 9. Чек-лист перед merge

- [ ] `git rebase origin/develop` без конфліктів.
- [ ] `npm run lint` зелений у backend і frontend.
- [ ] `npm test` зелений у backend і frontend.
- [ ] `npm run build` зелений у frontend.
- [ ] CI workflow `ci.yml` пройшов.
- [ ] Trivy / CodeQL не дали критичних попереджень.
- [ ] Документацію оновлено (`README.md`, `docs/*`, `openapi.yaml`).
- [ ] Якщо змінено API — оновлено `CHANGELOG.md` і номер версії за SemVer.
- [ ] Якщо додано env-змінну — оновлено `.env.example` й документацію.

Дякуємо за внесок!
