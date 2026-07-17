create index if not exists support_messages_admin_account_idx
  on public.support_messages (admin_account_id)
  where admin_account_id is not null;
