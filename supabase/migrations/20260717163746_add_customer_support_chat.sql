create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id bigint not null unique references public.loyalty_customers(id) on delete cascade,
  customer_email text not null,
  customer_name text,
  status text not null default 'new' check (status in ('new', 'open', 'answered', 'closed')),
  unread_admin integer not null default 0 check (unread_admin >= 0),
  unread_customer integer not null default 0 check (unread_customer >= 0),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_conversations_email_normalized check (customer_email = lower(trim(customer_email)))
);
create table if not exists public.support_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender text not null check (sender in ('customer', 'admin')),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  admin_account_id uuid references public.admin_accounts(id) on delete set null,
  delivery_channel text not null default 'chat' check (delivery_channel in ('chat', 'chat_email')),
  email_status text not null default 'not_requested' check (email_status in ('not_requested', 'pending', 'sent', 'failed')),
  email_error text,
  created_at timestamptz not null default now()
);
create index if not exists support_conversations_inbox_idx on public.support_conversations (status, last_message_at desc);
create index if not exists support_conversations_unread_admin_idx on public.support_conversations (unread_admin, last_message_at desc) where unread_admin > 0;
create index if not exists support_messages_conversation_idx on public.support_messages (conversation_id, created_at asc);
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
revoke all on table public.support_conversations from public, anon, authenticated;
revoke all on table public.support_messages from public, anon, authenticated;
comment on table public.support_conversations is 'Bandeja privada de consultas de clientes OLFFY. Acceso exclusivo mediante backend service role.';
comment on table public.support_messages is 'Mensajes de soporte cliente/admin y estado del aviso por correo.';
