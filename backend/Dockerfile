# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY backend/package.json backend/prisma.config.ts ./backend/
COPY backend/prisma ./backend/prisma/
COPY backend/tsconfig.json backend/tsconfig.build.json backend/nest-cli.json ./backend/

RUN pnpm install --frozen-lockfile --filter @fraggit/backend

COPY backend/src ./backend/src/

RUN pnpm --filter @fraggit/backend exec prisma generate
RUN pnpm --filter @fraggit/backend build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/prisma.config.ts ./backend/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/main.js"]
