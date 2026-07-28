create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'custom'
    check (role in ('owner', 'manager', 'cashier', 'custom')),
  permissions text[] not null default array['dashboard']::text[],
  status text not null default 'active'
    check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_accounts_email_normalized check (email = lower(trim(email))),
  constraint admin_accounts_permissions_valid check (
    permissions <@ array[
      'dashboard', 'ventas', 'pos', 'clientes', 'puntos', 'recompensas',
      'productos', 'colecciones', 'ajustes'
    ]::text[]
    and cardinality(permissions) > 0
  )
);

create unique index if not exists admin_accounts_email_unique_idx
  on public.admin_accounts (lower(email));

alter table public.admin_accounts enable row level security;

revoke all on table public.admin_accounts from anon, authenticated;

comment on table public.admin_accounts is
  'Cuentas administrativas OLFFY. Solo se accede desde rutas servidoras con service role.';
