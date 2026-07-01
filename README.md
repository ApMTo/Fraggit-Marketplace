# Fraggit

C2C/C2B маркетплейс товаров и услуг с упором на **доверие платформы**: модерация, сессии, CSRF, email-верификация, роли admin/moderator.

Monorepo: **NestJS** (backend) + **Next.js** (frontend).

---

## Стек

| Слой | Технологии |
|------|------------|
| Backend | NestJS 11, Prisma 7, PostgreSQL, Redis, BullMQ, Swagger, Pino |
| Auth | JWT (httpOnly cookies), refresh tokens, Redis sessions, CSRF, Argon2 |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TanStack Query |
| Infra | Docker Compose (Postgres + Redis), pnpm workspaces |

---

## Структура проекта

```
Fraggit/
├── backend/          # NestJS API (@fraggit/backend)
│   ├── prisma/       # Schema + migrations
│   └── src/
│       ├── modules/  # auth, users, listings, orders, ...
│       ├── database/ # Prisma, Redis
│       └── guards/   # JWT, CSRF, Roles
├── frontend/         # Next.js app (@fraggit/frontend)
├── docker-compose.yml
└── pnpm-workspace.yaml
```

---

## Быстрый старт

### Требования

- Node.js >= 20
- pnpm >= 9
- Docker (для Postgres и Redis)

### 1. Клонировать и установить зависимости

```bash
pnpm install
```

### 2. Поднять инфраструктуру

```bash
docker compose up -d
```

Поднимутся:
- **PostgreSQL** — `localhost:5432` (user/pass/db: `fraggit`)
- **Redis** — `localhost:6379`

### 3. Настроить переменные окружения

Скопируй `.env.example` в `.env` в корне и в `backend/` (или используй один `.env` в корне — backend читает `../.env`):

```bash
cp .env.example .env
cp .env.example backend/.env
```

Обязательно задай секреты JWT:

```env
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
```

### 4. Миграции и Prisma Client

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 5. Запуск

**Весь проект (backend + frontend):**

```bash
pnpm dev
```

**Только backend:**

```bash
pnpm dev:backend
# или
cd backend && npm run dev
```

**Только frontend:**

```bash
pnpm dev:frontend
```

| Сервис | URL |
|--------|-----|
| API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |
| Frontend | http://localhost:3000 |

---

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `NODE_ENV` | Окружение | `development` |
| `BACKEND_PORT` | Порт API | `3001` |
| `FRONTEND_URL` | CORS origin | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | пусто |
| `JWT_ACCESS_SECRET` | Secret для access token | fallback на `JWT_SECRET` |
| `JWT_REFRESH_SECRET` | Secret для refresh token | — |
| `JWT_ACCESS_EXPIRES_IN` | TTL access token | `20m` |
| `JWT_REFRESH_EXPIRES_IN` | TTL refresh token | `14d` |
| `SMTP_HOST` | SMTP сервер (опционально) | — |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP login | — |
| `SMTP_PASSWORD` | SMTP password | — |
| `SMTP_FROM` | From header | `Fraggit <no-reply@fraggit.local>` |
| `NEXT_PUBLIC_API_URL` | URL API для frontend | `http://localhost:3001/api` |

> Без SMTP письма (verify, reset password) **логируются в консоль backend** — удобно для локальной разработки и Postman.

---

## Auth API

Auth построен на **httpOnly cookies** + **CSRF header**. Подход аналогичен production-grade marketplace backend.

### Cookies после login / verify

| Cookie | Назначение |
|--------|------------|
| `access_token` | JWT access (20 мин) |
| `refresh_token` | JWT refresh (14 дней), path `/api/auth/refresh` |
| `sessionId` | ID сессии в Redis |
| `deviceId` | ID устройства |
| `XSRF-TOKEN` | CSRF token (не httpOnly) |

### CSRF

На mutating requests (POST/PATCH/DELETE), если есть `sessionId`, передавай header:

```
x-csrf-token: <csrfToken из ответа login/verify/refresh>
```

### Endpoints

| Method | Path | Auth | Описание |
|--------|------|------|----------|
| `POST` | `/api/auth/register` | Public | Регистрация → email verify |
| `GET` | `/api/auth/verify/:token` | Public | Подтверждение email + session |
| `POST` | `/api/auth/login` | Public | Вход |
| `GET` | `/api/auth/me` | JWT | Текущий пользователь |
| `POST` | `/api/auth/refresh` | Cookies + CSRF | Обновить access token |
| `POST` | `/api/auth/logout` | JWT + CSRF | Выход из текущей session |
| `POST` | `/api/auth/logout/all` | JWT + CSRF | Выход со всех устройств |
| `POST` | `/api/auth/forgot-password` | Public | Запрос сброса пароля |
| `GET` | `/api/auth/reset-password/:token` | Public | Проверка reset token |
| `POST` | `/api/auth/reset-password` | Public | Новый пароль |

### Register — body

```json
{
  "username": "cool_seller",
  "displayName": "Cool Seller",
  "email": "user@example.com",
  "password": "SecurePass1!"
}
```

**Правила:**
- `username` — 3+ символа, только `a-z`, `0-9`, `_`
- `password` — 8+ символов, заглавная, строчная, цифра, спецсимвол

### Login — body

```json
{
  "email": "user@example.com",
  "password": "SecurePass1!"
}
```

> Login работает только после **email verify**.

### Flow регистрации

```
POST /register → token в логах/email
       ↓
GET /verify/:token → user создан, cookies установлены
       ↓
GET /me → профиль
```

### Роли и статусы

**Roles:** `USER` | `MODERATOR` | `ADMIN`

**Status:** `ACTIVE` | `BANNED` | `SUSPENDED` | `PENDING_VERIFICATION`

Защита роутов:

```typescript
@Public()                          // без JWT
@Roles(UserRole.ADMIN)             // только admin+
@UseGuards(RolesGuard)
@CurrentUser() user: AuthUser      // текущий user
```

---

## Тестирование в Postman

1. Включи **автосохранение cookies** (Settings → Cookies).
2. **Register** → воз возьми verify token из логов backend.
3. **Verify** → сохрани `csrfToken` из ответа.
4. На **refresh / logout** добавь header `x-csrf-token`.
5. **Me** — cookies отправятся автоматически.

Пример register:

```
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "username": "test_user",
  "displayName": "Test User",
  "email": "test@example.com",
  "password": "SecurePass1!"
}
```

---

## Backend — скрипты

```bash
cd backend

npm run dev          # dev с hot reload
npm run build        # production build
npm run start:prod   # node dist/src/main
npm run lint         # eslint
npm run test         # unit tests
npm run test:e2e     # e2e tests

npx prisma migrate dev --name <name>   # новая миграция (dev)
npx prisma migrate deploy              # применить миграции (prod)
npx prisma studio                      # GUI для БД
```

---

## Frontend — скрипты

```bash
cd frontend

pnpm dev      # http://localhost:3000
pnpm build
pnpm start
pnpm lint
```

---

## Roadmap

| Этап | Статус | Описание |
|------|--------|----------|
| 1. Core Platform | 🔄 In progress | Users, Auth, Listings, Categories |
| 2. Marketplace Core | ⏳ Planned | Orders без денег |
| 3. Moderation | ⏳ Planned | Admin panel, reports, bans |
| 4. Security | ⏳ Planned | 2FA, session control |
| 5. Chat + Tickets | ⏳ Planned | Buyer ↔ seller, support |
| 6. Telegram | ⏳ Planned | Notifications |
| 7. Payments | ⏳ Planned | Последний шаг |

---

## Troubleshooting

### `exports is not defined in ES module scope`

Prisma client не должен компилироваться в `dist/`. Используй `@prisma/client` (стандартный output). Если ошибка повторилась:

```bash
cd backend
Remove-Item -Recurse -Force dist   # Windows
npm run build
```

### `400` на register

Проверь validation: username format, password policy (см. выше).

### Redis / Postgres connection refused

```bash
docker compose ps
docker compose up -d
```

### Verify token не приходит на email

Смотри логи backend — без SMTP token пишется в `htmlPreview` в логе `MailService`.

---

## License

Private / UNLICENSED
