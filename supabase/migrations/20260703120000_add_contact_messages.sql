-- Mensajes del formulario de contacto del storefront.
-- Sin policies: solo el service role (backend) puede leer/escribir.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'read', 'answered', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create index contact_messages_status_idx
  on public.contact_messages (status, created_at desc);
