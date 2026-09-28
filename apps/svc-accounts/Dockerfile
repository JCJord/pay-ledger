# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/svc-accounts/package.json ./apps/svc-accounts/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy shared-types source and build it first
COPY packages/shared-types/ ./packages/shared-types/
RUN pnpm --filter @pay-ledger/shared-types build

# Copy svc-accounts source
COPY apps/svc-accounts/ ./apps/svc-accounts/

# Generate Prisma client
RUN pnpm --filter svc-accounts exec prisma generate

# Build the NestJS app
RUN pnpm --filter svc-accounts build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/svc-accounts/package.json ./apps/svc-accounts/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy build artifacts
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/svc-accounts/dist ./apps/svc-accounts/dist
COPY --from=builder /app/apps/svc-accounts/node_modules/.prisma ./apps/svc-accounts/node_modules/.prisma
COPY apps/svc-accounts/prisma ./apps/svc-accounts/prisma

WORKDIR /app/apps/svc-accounts

EXPOSE 3002

CMD ["node", "dist/main"]
