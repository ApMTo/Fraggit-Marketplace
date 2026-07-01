# Fraggit Backend

NestJS API для маркетплейса Fraggit.

## Запуск

```bash
# из корня monorepo
docker compose up -d
pnpm install

cd backend
cp ../.env.example .env   # или используй корневой .env
npx prisma migrate deploy
npx prisma generate
npm run dev
```

- API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs

## Модули

| Модуль | Статус | Описание |
|--------|--------|----------|
| `auth` | ✅ Ready | Register, login, verify, refresh, logout, password reset |
| `sessions` | ✅ Ready | Redis session store |
| `token` | ✅ Ready | JWT access + refresh |
| `mail` | ✅ Ready | SMTP или console fallback |
| `users` | 🚧 Stub | Публичные профили |
| `listings` | 🚧 Stub | Товары/услуги |
| `orders` | 🚧 Stub | Сделки |
| `moderation` | 🚧 Stub | Модерация |
| `chat` | 🚧 Stub | Чат buyer ↔ seller |
| `tickets` | 🚧 Stub | Support tickets |
| `notifications` | 🚧 Stub | In-app уведомления |
| `telegram` | 🚧 Stub | Telegram layer |
| `payments` | 🚧 Stub | Платежи (последний этап) |

## Auth — детали реализации

- **Access token:** 20 мин, httpOnly cookie `access_token`
- **Refresh token:** 14 дней, cookie `refresh_token` (path `/api/auth/refresh`)
- **Sessions:** Redis, привязка device + subnet + user-agent
- **CSRF:** per-session token, header `x-csrf-token`
- **Rate limit login:** 5 failed attempts → block 15 min
- **Password:** Argon2id
- **Email verify:** pending registration in Redis (TTL 15 min)

## Guards (global)

- `JwtAuthGuard` — все routes protected, кроме `@Public()`
- `CsrfGuard` — CSRF на mutating requests при наличии session
- `ThrottlerGuard` — rate limiting

## Prisma

```bash
npx prisma migrate dev --name <name>
npx prisma migrate deploy
npx prisma studio
npx prisma generate
```

Schema: `prisma/schema.prisma`  
Client: `@prisma/client`

## Структура auth

```
src/modules/auth/
├── auth.controller.ts
├── auth.service.ts
├── auth-login.service.ts
├── auth-registration.service.ts
├── auth-session.service.ts
├── auth-password-reset.service.ts
├── user-auth-cache.service.ts
├── guards/          # jwt, csrf, roles
├── strategies/      # jwt.strategy
├── decorators/      # @Roles, @StrictRoles
├── dto/
├── utils/           # cookies, password, login attempts
└── responses/       # Swagger DTOs
```

Полная документация API — в [корневом README](../README.md).
