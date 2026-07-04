alter table public.physical_sale_attempts
  add column if not exists olffy_reference text,
  add column if not exists expected_total numeric(12, 2),
  add column if not exists currency text not null default 'CLP'
    check (currency = 'CLP'),
  add column if not exists received_total numeric(12, 2),
  add column if not exists remote_payment_status text not null default 'manual'
    check (
      remote_payment_status in (
        'manual',
        'created',
        'sent',
        'paid',
        'failed',
        'cancelled',
        'expired',
        'reconciliation_required'
      )
    ),
  add column if not exists provider_transaction_id text,
  add column if not exists provider_event_id text,
  add column if not exists remote_payment_response jsonb not null default '{}'::jsonb,
  add column if not exists payment_payload_snapshot jsonb,
  add column if not exists received_at timestamptz,
  add column if not exists processed_at timestamptz;

create unique index if not exists physical_sale_attempts_olffy_reference_unique_idx
  on public.physical_sale_attempts (olffy_reference)
  where olffy_reference is not null;

create index if not exists physical_sale_attempts_provider_transaction_idx
  on public.physical_sale_attempts (provider_transaction_id)
  where provider_transaction_id is not null;

create index if not exists physical_sale_attempts_provider_event_idx
  on public.physical_sale_attempts (provider_event_id)
  where provider_event_id is not null;

create index if not exists physical_sale_attempts_remote_status_idx
  on public.physical_sale_attempts (remote_payment_status, updated_at);
