# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/svc-auth/package.json ./apps/svc-auth/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy shared-types source and build it first
COPY packages/shared-types/ ./packages/shared-types/
RUN pnpm --filter @pay-ledger/shared-types build

# Copy svc-auth source
COPY apps/svc-auth/ ./apps/svc-auth/

# Generate Prisma client
RUN pnpm --filter svc-auth exec prisma generate

# Build the NestJS app
RUN pnpm --filter svc-auth build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/svc-auth/package.json ./apps/svc-auth/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy build artifacts
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/svc-auth/dist ./apps/svc-auth/dist
COPY --from=builder /app/apps/svc-auth/node_modules/.prisma ./apps/svc-auth/node_modules/.prisma
COPY apps/svc-auth/prisma ./apps/svc-auth/prisma

WORKDIR /app/apps/svc-auth

EXPOSE 3001

CMD ["node", "dist/main"]
