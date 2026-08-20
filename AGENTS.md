# AGENTS.md

This document provides an overview of the project structure for developers and AI agents working on this codebase.

## Project Overview

A management application for a bakery ("Panadería La Espiga"): register products and prices, record sales, manage
special-order services (custom cakes, catering), and schedule customer appointments/orders. Built with TanStack Start
and deployed on Netlify, backed by Netlify Database (Postgres) via Drizzle ORM.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Database | Netlify Database (Postgres) via Drizzle ORM |
| Validation | Zod |
| Language | TypeScript 5.9 |
| Deployment | Netlify |

## Directory Structure

```
├── db
│   ├── schema.ts               # Drizzle table definitions: products, services, sales, sale_items, appointments
│   └── index.ts                # Drizzle client (Netlify Database adapter)
├── drizzle.config.ts           # Drizzle Kit config; migrations output to netlify/database/migrations
├── netlify/database/migrations # Generated SQL migrations (auto-applied at deploy time)
├── src
│   ├── server
│   │   ├── products.functions.ts      # CRUD server functions for products/prices
│   │   ├── services.functions.ts      # CRUD server functions for services
│   │   ├── sales.functions.ts         # Create/list/delete sales with line items
│   │   └── appointments.functions.ts  # CRUD + status updates for scheduled appointments
│   ├── routes
│   │   ├── __root.tsx    # Root layout: header with nav (Panel, Productos, Ventas, Servicios, Agenda)
│   │   ├── index.tsx     # Dashboard: today's sales, active products, upcoming appointments
│   │   ├── productos.tsx # Product/price catalog, grouped by category, with create/edit/toggle/delete
│   │   ├── ventas.tsx    # Sale registration (cart of products) + sales history
│   │   ├── servicios.tsx # Special services catalog (custom cakes, catering, etc.)
│   │   └── agenda.tsx    # Appointment scheduling with status tracking
│   ├── router.tsx        # TanStack Router setup
│   └── styles.css        # Tailwind import + base styles
├── netlify.toml
├── package.json
└── vite.config.ts
```

## Key Concepts

### Data Model (`db/schema.ts`)

- `products` — name, category, price, unit, active flag. The editable price catalog.
- `services` — name, description, base price for custom/special orders.
- `sales` + `sale_items` — a sale has a total and payment method; each `sale_items` row is a line item
  (product snapshot: name, quantity, unit price, subtotal) so historical sales stay accurate even if a
  product's price later changes.
- `appointments` — scheduled customer orders/services with a status (`pendiente`, `confirmada`,
  `completada`, `cancelada`).

Any schema change requires a new Drizzle migration: `npx drizzle-kit generate --name <description>`.

### Server Functions

All database access goes through `createServerFn` wrappers in `src/server/*.functions.ts` — route loaders and
components call these rather than importing `db` directly, since loaders run isomorphically (client + server).

### File-Based Routing (TanStack Router)

Routes are defined by files in `src/routes/`. Each page loads its data via a route `loader` that calls the
corresponding server functions, and mutations call `router.invalidate()` afterward to refresh loader data.

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
```

## Conventions

- Routes: kebab-case files under `src/routes/`, in Spanish to match the UI (`productos`, `ventas`, `servicios`, `agenda`).
- Server functions: one file per domain, suffixed `.functions.ts`.
- Money columns are stored as Postgres `numeric` and handled as strings/`Number()` conversions in the UI.
- Styling: Tailwind CSS utility classes with an amber/warm color palette matching the bakery theme.
