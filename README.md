# TaskFlow

[![Test](https://github.com/ShmagiGavashelashvili/taskflow-landing/actions/workflows/test.yml/badge.svg)](https://github.com/ShmagiGavashelashvili/taskflow-landing/actions/workflows/test.yml)
![Coverage](https://raw.githubusercontent.com/ShmagiGavashelashvili/taskflow-landing/badges/coverage.svg)

TaskFlow is a project management app for small teams. This repo has the marketing landing page at `/` and a working app prototype behind it. In the prototype you can register, log in, manage workspaces and members, work on project boards and lists, open task details with comments, and use a dashboard, a timeline, billing, integrations and automations.

There's no database or third-party service yet. All data comes from a seeded in-memory mock store behind repository interfaces, so a real backend can replace it without touching the API or the UI (see [Replacing the mocks](#replacing-the-mocks)).

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, shadcn/ui, TanStack Query and zod.

## Running the prototype

You need Node.js 20.9 or later.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server. Mock data is saved to `.data/db.json` so it survives restarts. |
| `npm run build` then `npm start` | Production build and server. `npm start` needs `SESSION_SECRET` (see below). |
| `npm test` | All tests (Vitest). `npm run test:coverage` adds coverage. |
| `npm run lint` | ESLint. |

To reset local data to the seed, stop the dev server and delete `.data/db.json`.

### App map

- `/`: the landing page. Start Free Trial goes to registration, and the hero email field goes there with the email pre-filled. Pricing buttons pre-select their plan. Log in becomes Go to app once you're signed in.
- `/register`, `/login`, `/forgot-password`, `/reset-password`: authentication. No email is sent, so in demo mode the password reset link is shown on screen. Outside demo mode the forgot-password response is the same whether or not the email has an account, and the link isn't returned; a real implementation emails it.
- `/app`: the signed-in app (dashboard, projects with board and list views, task details, timeline, and settings for profile, workspace, members, billing, integrations and automations). Logged-out visitors are sent to login and then returned to the page they asked for.
- `/invite/<token>`: invite acceptance. Owners get a copyable invite link instead of an email.

## Demo credentials

The seed creates the workspace **Acme Studio** on the paid Pro plan, with three projects, tasks (some of them overdue), comments, invoices and connected integrations.

| Email | Password | Role |
|---|---|---|
| `demo@taskflow.app` | `demo1234` | Owner (Alex Morgan) |
| `priya@acme.studio` | `demo1234` | Member |
| `marcus@acme.studio` | `demo1234` | Member |
| `lena@acme.studio` | `demo1234` | Member |
| `tom@acme.studio` | `demo1234` | Member |

Demo mode is on by default in development and on Vercel previews (see `DEMO_MODE` below). In demo mode the login page shows the owner credentials, and the app shows a "Demo environment: data may reset" badge. New accounts you register start a 14-day trial of the plan you picked (Pro by default). The mock checkout is pre-filled with a test card.

With `DATABASE_URL` set (Vercel production and previews, via the Neon integration) data lives in Postgres: the schema is created and the demo workspace seeded on the first request, and registered accounts and edits persist. Without it (local development, tests) the app uses the seeded in-memory store, which resets on restart.

## Environment variables

All of them are optional in development. They're read in `server/config.ts`, except `NEXT_PUBLIC_SITE_URL` (`constants/site.ts`).

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | Unset: in-memory store | Postgres connection string (pooled). Provisioned and set by the Vercel Marketplace Neon integration; pull it locally with `vercel env pull` to run against the database. |
| `SESSION_SECRET` | Fixed dev-only key | Signs the session cookie (HS256). **Required in production**, including `npm start` and Vercel previews. Generate one with `openssl rand -base64 32`. |
| `DEMO_MODE` | On in development and Vercel previews, off in Vercel production and `npm start` | `true` or `false` overrides the default. Demo mode shows the demo badge, the credential hint on the login page and the on-screen password reset link. The seeded demo accounts work either way. |
| `MOCK_LATENCY_MS` | `300` in development and Vercel previews, `0` in production and tests | Simulated delay, added once per API request or page render (on its first mock store call), so loading states are visible. |
| `MOCK_FAILURE_RATE` | `0` | Probability (0 to 1) that an API request or page render fails with `UNAVAILABLE`, to exercise error states. Decided once per request, so failures don't compound across store calls. |
| `NEXT_PUBLIC_SITE_URL` | Vercel production URL, else `http://localhost:3000` | Canonical URL for metadata, the sitemap and robots.txt. |

For example, `MOCK_LATENCY_MS=1500 MOCK_FAILURE_RATE=0.2 npm run dev` gives you slow and flaky data.

## Replacing the mocks

The full decision is in [ADR 0002](docs/adr/0002-mock-data-behind-repositories.md). In short, requests flow through these layers:

1. Route handlers (`app/api/**/route.ts`): the HTTP contract, validated with the zod schemas in `lib/schemas/`.
2. Services (`server/services/`): business rules, permissions and plan limits.
3. Repository interfaces (`server/repositories/types.ts`): one per entity.
4. Implementations: today only the seeded memory store in `server/repositories/memory/`.

`server/container.ts` is the only place that picks an implementation. To move to a real database or backend:

1. Implement every interface in `server/repositories/types.ts`, for example in `server/repositories/postgres/`. Follow the conventions at the top of that file: async methods, return copies, no cascading deletes.
2. Make the API test suite pass against it. Point `setupTestContainer` in `tests/api.ts` at a container built from the new implementation, for example a throwaway database per test file.
3. Select it in `createContainer()` in `server/container.ts`, for example when `DATABASE_URL` is set. Keep the memory store as the fallback for demos and tests.
4. Replace the mocked side effects behind the same service methods: the on-screen password reset link (email it instead; the API already returns `resetUrl: null` outside demo mode), invite links and the mock checkout. API responses keep their shape.

Services, route handlers, schemas, the API client (`lib/api/`) and the UI don't change.

## Deploy on Vercel

Import the repo into [Vercel](https://vercel.com/new) and set `SESSION_SECRET` for the Production and Preview environments. Add the Neon integration from the Marketplace (`vercel integration add neon`) so `DATABASE_URL` is set; without it each server instance keeps its own in-memory data and sign-ups won't survive.
