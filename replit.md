# SmartLib Pro

A full-stack automated library management system for universities, schools, and public libraries.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/smartlib-pro run dev` — run the React frontend (port 23393, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + shadcn/ui + Tailwind CSS v4 + wouter + TanStack Query
- API: Express 5 + cookie-session (in-memory Map)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (10 tables)
- `lib/api-client-react/src/` — generated React Query hooks + custom fetch
- `lib/api-zod/src/` — generated Zod request/response validators
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/auth.ts` — PBKDF2 password hashing + session token helpers
- `artifacts/smartlib-pro/src/pages/` — React pages for each feature area
- `artifacts/smartlib-pro/src/components/layout.tsx` — sidebar + nav layout

## Architecture decisions

- **Cookie-based sessions**: In-memory Map keyed by random token; cookie `session_token` is httpOnly. Simple and sufficient for a single-instance deployment.
- **PBKDF2 password hashing**: Node.js built-in `crypto.pbkdf2Sync`, no external bcrypt dependency.
- **`credentials: "include"` on all fetches**: Set in `lib/api-client-react/src/custom-fetch.ts` so session cookies are forwarded on every API call through the shared proxy.
- **Role-based UI**: Admin sees all nav items; librarian sees most; student sees borrowing/reservations/fines/notifications only. Protected routes enforce this server-side too.
- **Generated API client**: Orval generates typed React Query hooks from OpenAPI spec. Always run codegen after changing `openapi.yaml`.

## Product

- **Login** with three roles: Admin, Librarian, Student
- **Dashboard** with live stats (total books, active members, borrows, overdue count) and charts
- **Books Catalog** — searchable table of all books with availability badges
- **Borrowing Records** — filter by status (active/overdue/returned), return/renew actions for librarians
- **Reservations** — manage book hold requests with status filtering and cancel actions
- **Fines Management** — outstanding fine totals, pay-off workflow for librarians
- **Notifications** — per-user notification feed with mark-read actions
- **Members** (admin only) — user management table with add-member dialog
- **Activity Log** (admin only) — full audit trail of all system events
- **System Setup** (admin/librarian) — manage Authors, Categories, Publishers

## Demo credentials

| Role      | Email                        | Password       |
|-----------|------------------------------|----------------|
| Admin     | admin@smartlib.edu           | admin123       |
| Librarian | librarian@smartlib.edu       | librarian123   |
| Student   | alice.chen@student.edu       | student123     |

## Gotchas

- Sessions are stored in-memory — restarting the API server logs everyone out.
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`, then `pnpm run typecheck:libs` to rebuild lib declarations.
- `pnpm --filter @workspace/db run push` is dev-only; for production schema changes use Drizzle migrations.
- `useListCategories` and `useListPublishers` take no params argument (only options). `useListAuthors` takes an optional params arg. Check generated hook signatures before adding pagination.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
