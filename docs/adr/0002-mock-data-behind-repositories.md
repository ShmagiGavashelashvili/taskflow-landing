# 2. Mock data behind repository interfaces, swapped in one container

Status: accepted (2026-10-16)

## Context

The prototype (issue #1) needs working auth, workspaces, projects, a board and settings, but there is no database or third-party service yet. A real backend will replace the mocks later, and that change must not ripple through the API contract, the client or the UI.

## Decision

The Next.js app owns the backend. Layers, from outside in:

1. **Route handlers** (`app/api/**/route.ts`) are the public HTTP contract. They stay thin: authenticate, parse the request with a zod schema, call a service, return JSON. They're wrapped in `route()` from `server/http/handler.ts`, which turns a thrown `DomainError` into `{ error: { code, message, fieldErrors? } }` with the status from `ERROR_STATUS` (`lib/api/errors.ts`).
2. **Services** hold business rules, authorization and plan limits, and throw `DomainError`s (`server/domain/errors.ts`). They get storage only through the container and read time only from `container.clock`.
3. **Repository interfaces** (`server/repositories/types.ts`), one per entity. They're async and return copies, and they don't cascade.
4. **Implementations.** Today that's only `server/repositories/memory/`: a seeded in-memory store (`server/seed.ts`). In development it's saved to the gitignored `.data/db.json`. It's wrapped with simulated latency and failures (`MOCK_LATENCY_MS`, `MOCK_FAILURE_RATE`).

`server/container.ts` is the **single swap point**. `getContainer()` builds the repositories for the running environment once per process. Nothing else may import an implementation.

Zod schemas in `lib/schemas/` are the single source of truth for the domain model and the request and response shapes. Route handlers, the typed client (`lib/api/client.ts`) and forms all share them. Server-only fields (password hashes, reset tokens) live in `server/domain/types.ts` and never appear there.

Every module under `server/` imports `server-only`. First page loads may call services directly from Server Components. Client interactions go through `/api/*`. Server Actions are not used for data mutations, so the HTTP API stays the only contract.

Feature UI follows ADR 0001: it stays with its route until a second consumer appears.

## Swap procedure

To move to a real database (or another backend):

1. Add an implementation of every interface in `server/repositories/types.ts`, e.g. `server/repositories/postgres/`, honouring the conventions documented at the top of that file.
2. Make the Seam A suite pass against it. Point `setupTestContainer` in `tests/api.ts` at a container built from the new implementation (for example a throwaway database per test file).
3. Select it in `createContainer()` in `server/container.ts`, e.g. when `DATABASE_URL` is set. Keep the memory implementation as the fallback for demos and tests.
4. Replace mocked side effects (reset links returned to the client, invite links, mock checkout) behind the same service methods. The API responses don't change shape.

Services, route handlers, schemas, the API client and the UI don't change.

## Consequences

- Seam A tests (route handlers called in-process against a fresh seeded container) are the regression suite for any future implementation. There are no separate repository or service unit tests.
- On Vercel the memory store is per instance and may reset to the seed. Demo accounts always work, but registered accounts and edits can disappear. Persistent storage is a container-level change.
- Filtering that a database would do (task filters, date ranges) is part of the repository query interfaces, so a real implementation can push it down to SQL.
