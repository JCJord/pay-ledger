# svc-auth

Authentication and identity management service for PayLedger.

## Responsibilities

- User registration and login
- JWT access token issuance (15min TTL)
- Refresh token rotation (7 days, httpOnly cookie)
- Publishes `user.registered` event to RabbitMQ on registration

## Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Register new user |
| POST | `/api/v1/auth/login` | Public | Login |
| POST | `/api/v1/auth/refresh` | Cookie | Rotate refresh token |
| POST | `/api/v1/auth/logout` | JWT | Revoke tokens |
| GET | `/api/v1/auth/me` | JWT | Current user info |

## Running locally

> Requires Docker Desktop running with infra containers up.

```bash
# 1. Start infra (from project root)
docker compose up -d postgres redis rabbitmq

# 2. Run migration (first time only)
npx prisma migrate dev --name init

# 3. Start in watch mode
pnpm dev
```

Swagger docs → http://localhost:3001/docs

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `3001` |
| `DATABASE_URL` | Postgres connection string | — |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Refresh token TTL | `7` |
| `RABBITMQ_URI` | RabbitMQ connection string | — |

## Events published

| Event | Exchange | Trigger |
|-------|----------|---------|
| `user.registered` | `payledger.events` | After successful registration |

## Database

**`payledger_auth`** — owns two tables:
- `users` — email, hashed password, role
- `refresh_tokens` — hashed token, userId, expiry
