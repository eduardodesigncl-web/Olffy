alter table public.support_conversations
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by_admin_id uuid
    references public.admin_accounts(id) on delete set null,
  add column if not exists archived_by_admin_name text;

create index if not exists support_conversations_archived_at_idx
  on public.support_conversations (archived_at desc, last_message_at desc)
  where archived_at is not null;

create index if not exists support_conversations_archived_by_admin_idx
  on public.support_conversations (archived_by_admin_id)
  where archived_by_admin_id is not null;

comment on column public.support_conversations.archived_at is
  'Retira la conversación de la bandeja activa sin eliminar su historial; puede restaurarse.';
