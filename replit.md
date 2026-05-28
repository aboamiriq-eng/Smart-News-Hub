# منصة النبأ — AL NABA Smart News Platform

منصة إخبارية ذكية ثنائية اللغة (عربي/إنجليزي) مع أتمتة كاملة وتحسين SEO متكامل.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/news-platform run dev` — run the frontend (port 20376, served at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + TailwindCSS + shadcn/ui + framer-motion
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- SEO: react-helmet-async + JSON-LD structured data

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (articles, categories, sources, advertisements, settings, page_views)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/news-platform/src/` — React frontend
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — auto-generated Zod schemas (do not edit)

## Architecture decisions

- Contract-first API: OpenAPI spec gates codegen which gates the frontend. Always update spec then run codegen before implementing routes.
- Language detection: `navigator.language` on mount, stored in localStorage as `"lang"` ("ar"/"en"), sets `dir="rtl"` on `<html>` for Arabic.
- Article slugs: auto-generated from title + timestamp if not provided. Unique constraint in DB.
- Settings stored as key-value rows in `settings` table with defaults in code.
- View tracking: POST /articles/:id/view increments view_count and inserts a page_views row for analytics.

## Product

- **Public site**: Home with breaking news ticker + featured hero article + latest news grid + trending sidebar. Article detail with SEO meta tags, JSON-LD structured data, related articles. Category and search pages.
- **Admin panel** (/admin): Dashboard with live metrics, Articles CRUD, Categories, Sources, Advertisements, Analytics charts, Settings.
- **Bilingual**: Full AR/EN support with automatic RTL switching. Language switcher in navbar.
- **SEO**: Dynamic meta tags per article, Open Graph, Twitter Cards, JSON-LD NewsArticle schema, sitemap endpoint.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before touching any route or hook code.
- Body schema component names must NOT match `<OperationIdPascal>Body` pattern — use entity-shaped names (e.g. `ArticleInput` not `CreateArticleBody`) to avoid TS2308 collisions.
- The news-platform frontend runs on its own Vite server. The API is proxied through the shared reverse proxy at `/api`.
- `react-helmet-async` has a peer dep warning against React 19 but works fine.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
