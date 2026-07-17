# CODEX INSTRUCTIONS — OLFFY Frontend

## What this package is

This is a **visually-complete React/TypeScript frontend** for the OLFFY papelería brand. All UI, design tokens, layout, and interactions are finalized. Your job is to connect the mock adapters to real backends.

## What NOT to change

- Colors, fonts, spacing, layout, hierarchy — the visual design is locked
- Any component that does not have a `data-action` or `data-bind` attribute — it is UI-only
- The `contracts/` directory — TypeScript interfaces are the source of truth
- `olffy-tokens.css` — CSS custom properties must not be modified

## How to connect backends

### Step 1: Environment variables

Create `.env.local` with:

```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=...
SHOPIFY_ADMIN_TOKEN=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Step 2: Swap adapters

In `adapters/frontend-actions.ts`, replace each mock import with a real implementation. Each real action must match the exact function signature in `adapters/mock-actions.ts`.

Example:

```typescript
// Before (mock):
export { addToCart } from "./mock-actions";

// After (real):
export { addToCart } from "./shopify-actions"; // your file
```

### Step 3: Replace mock-data.ts

Each `data-bind` element is a placeholder. Replace with actual data fetching:

- `data-bind="shopify-products"` → fetch from Shopify Storefront API
- `data-bind="supabase-customers"` → fetch from Supabase `customers` table
- See `docs/INTEGRATION_MAP.md` for the full mapping

### Step 4: Auth

The `LoginPage` and `RegisterPage` components have `data-bind="supabase-email"` and `data-bind="supabase-password"` inputs. Connect these to `supabase.auth.signInWithPassword` and `supabase.auth.signUp`.

## File locations

- Contracts: `contracts/*.types.ts`
- Mock data: `adapters/mock-data.ts`
- Mock actions: `adapters/mock-actions.ts`
- Action swap point: `adapters/frontend-actions.ts`
- Full route map: `docs/ROUTE_MAP.md`
- Full integration map: `docs/INTEGRATION_MAP.md`

## Admin panel

The admin panel (`components/admin/AdminShell.tsx`) posts to `/api/admin/auth`. Configure `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` server-side before production, or replace the password gate with Supabase role-based admin auth.

## Supabase schema (minimum required tables)

```sql
-- customers
id uuid primary key references auth.users,
name text,
email text unique,
phone text,
points integer default 0,
orders_count integer default 0,
created_at timestamptz default now()

-- rewards
id uuid primary key default gen_random_uuid(),
title text,
description text,
points_cost integer,
type text, -- 'discount' | 'product' | 'shipping'
value text

-- redemptions
id uuid primary key default gen_random_uuid(),
customer_id uuid references customers,
reward_id uuid references rewards,
reward_title text,
points_used integer,
status text default 'requested',
code text,
created_at timestamptz default now()

-- physical_sales
id uuid primary key default gen_random_uuid(),
customer_id uuid references customers,
amount numeric,
items text[],
points_issued integer default 0,
sale_date timestamptz default now()
```
