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


Private / UNLICENSED
