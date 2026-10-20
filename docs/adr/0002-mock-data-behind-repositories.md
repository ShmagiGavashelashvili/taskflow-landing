# 2. Mock data behind repository interfaces, swapped in one container

Status: accepted (2026-10-16)

## Context

The prototype (issue #1) needs working auth, workspaces, projects, a board and settings, but there is no database or third-party service yet. A real backend will replace the mocks later, and that change must not ripple through the API contract, the client or the UI.

## Decision

The Next.js app owns the backend. Layers, from outside in:

1. **Route handlers** (`app/api/**/route.ts`) are the public HTTP contract. They stay thin: authenticate, parse the request with a zod schema, call a service, return JSON. They're wrapped in `route()` from `server/http/handler.ts`, which turns a thrown `DomainError` into `{ error: { code, message, fieldErrors? } }` with the status from `ERROR_STATUS` (`lib/api/errors.ts`).
2. **Services** hold business rules, authorization and plan limits, and throw `DomainError`s (`server/domain/errors.ts`). They get storage only through the container and read time only from `container.clock`.
3. **Repository interfaces** (`server/repositories/types.ts`), one per entity. They're async and return copies, and they don't cascade.
4. **Implementations.** Two adapters satisfy the interfaces. `server/repositories/postgres/` (Neon) is used when `DATABASE_URL` is set; `server/repositories/memory/` is the fallback for local development, demos and tests: a seeded in-memory store (`server/seed.ts`). In development it's saved to the gitignored `.data/db.json`. It's wrapped with simulated latency and failures (`MOCK_LATENCY_MS`, `MOCK_FAILURE_RATE`), applied once per request rather than per repository call: `route()` runs each API handler in a request scope (`server/request-scope.ts`, AsyncLocalStorage) and server renders get one through React's `cache`. Both are zero in tests and default to zero outside development and Vercel previews.

`server/container.ts` is the **single swap point**. `getContainer()` builds the repositories for the running environment once per process. Nothing else may import an implementation.

Zod schemas in `lib/schemas/` are the single source of truth for the domain model and the request and response shapes. Route handlers, the typed client (`lib/api/client.ts`) and forms all share them. Server-only fields (password hashes, reset tokens) live in `server/domain/types.ts` and never appear there.

Every module under `server/` imports `server-only`. First page loads may call services directly from Server Components. Client interactions go through `/api/*`. Server Actions are not used for data mutations, so the HTTP API stays the only contract.

Feature UI follows ADR 0001: it stays with its route until a second consumer appears.

## Swap procedure

To move to a real database (or another backend):

1. Add an implementation of every interface in `server/repositories/types.ts`, e.g. `server/repositories/postgres/`, honouring the conventions documented at the top of that file.
2. Make the repository contract suite (`server/repositories/contract.test.ts`) pass against it by adding it to that file's adapter list. The Postgres adapter runs there when `TEST_DATABASE_URL` points at a scratch database. Seam A route tests still run on the memory adapter; they exercise services and handlers, and the contract suite keeps the adapters behaving the same underneath.
3. Select it in `createContainer()` in `server/container.ts`, e.g. when `DATABASE_URL` is set. Keep the memory implementation as the fallback for demos and tests.
4. Replace mocked side effects (reset links returned to the client, invite links, mock checkout) behind the same service methods. The API responses don't change shape. `POST /api/auth/forgot-password` already answers `{ resetUrl: null }` for every email outside demo mode, so it doesn't reveal which emails have accounts; a real implementation emails the link and keeps that response. Only demo mode returns the link, for on-screen display.

Services, route handlers, schemas, the API client and the UI don't change.

## Consequences

- The contract suite is what keeps the adapters from drifting: query semantics that exist twice (task filters in JS and in SQL) are asserted once, against both.

- Seam A tests (route handlers called in-process against a fresh seeded container) are the regression suite for any future implementation. There are no separate repository or service unit tests.
- On Vercel the memory store is per instance and may reset to the seed. Demo accounts always work, but registered accounts and edits can disappear. Persistent storage is a container-level change.
- Filtering that a database would do (task filters, date ranges) is part of the repository query interfaces, so a real implementation can push it down to SQL.
