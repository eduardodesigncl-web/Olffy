create table public.olffy_order_refs (
  id uuid primary key default gen_random_uuid(),
  olffy_reference text not null unique,
  channel text not null check (channel in ('online', 'physical')),
  sale_channel_detail text not null,
  shopify_order_id text unique,
  shopify_order_name text,
  shopify_customer_id text,
  customer_email text,
  loyalty_customer_id bigint
    references public.loyalty_customers(id) on delete set null,
  physical_sale_id bigint unique
    references public.physical_sales(id) on delete set null,
  payment_provider text not null default 'tuu',
  payment_reference text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'confirmed', 'rejected', 'manual_review')),
  tax_status text not null default 'pending'
    check (tax_status in ('pending', 'issued', 'accepted', 'rejected', 'manual_review')),
  loyalty_status text not null default 'pending'
    check (loyalty_status in ('pending', 'processed', 'skipped', 'failed')),
  marketing_status text not null default 'pending'
    check (marketing_status in ('pending', 'processed', 'skipped', 'failed')),
  total integer not null check (total >= 0),
  currency text not null default 'CLP' check (currency = 'CLP'),
  metadata jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index olffy_order_refs_status_idx
  on public.olffy_order_refs (payment_status, tax_status, created_at desc);
create index olffy_order_refs_customer_idx
  on public.olffy_order_refs (loyalty_customer_id, created_at desc)
  where loyalty_customer_id is not null;

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  idempotency_key text not null unique,
  provider_event_id text,
  payment_reference text not null,
  olffy_reference text not null,
  expected_total integer not null check (expected_total >= 0),
  received_total integer check (received_total is null or received_total >= 0),
  currency text not null default 'CLP' check (currency = 'CLP'),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'confirmed', 'rejected', 'manual_review')),
  payload_fingerprint text not null,
  payload_snapshot jsonb not null default '{}'::jsonb,
  processing_token uuid,
  lease_until timestamptz,
  retry_count integer not null default 0 check (retry_count >= 0),
  last_error text,
  received_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index payment_events_status_lease_idx
  on public.payment_events (status, lease_until, created_at);
create index payment_events_reference_idx
  on public.payment_events (payment_reference);

create table public.tax_document_refs (
  id uuid primary key default gen_random_uuid(),
  order_ref_id uuid not null unique
    references public.olffy_order_refs(id) on delete cascade,
  shopify_order_id text not null unique,
  shopify_order_name text,
  olffy_reference text not null,
  document_type text not null default 'boleta_afecta',
  provider text not null,
  idempotency_key text not null unique,
  folio text,
  sii_status text not null default 'pending'
    check (sii_status in ('pending', 'issued', 'accepted', 'rejected', 'manual_review')),
  issued_at timestamptz,
  total integer not null check (total >= 0),
  currency text not null default 'CLP' check (currency = 'CLP'),
  pdf_url text,
  xml_url text,
  response_url text,
  retry_count integer not null default 0 check (retry_count >= 0),
  error_message text,
  provider_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tax_document_refs_status_idx
  on public.tax_document_refs (sii_status, created_at);

create table public.marketing_event_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  idempotency_key text not null unique,
  shopify_customer_id text,
  loyalty_customer_id bigint
    references public.loyalty_customers(id) on delete set null,
  email text,
  related_order_ref_id uuid
    references public.olffy_order_refs(id) on delete set null,
  related_loyalty_transaction_id bigint
    references public.loyalty_transactions(id) on delete set null,
  payload_minimal jsonb not null default '{}'::jsonb,
  provider text not null default 'noop',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'processed', 'failed', 'cancelled')),
  processing_token uuid,
  lease_until timestamptz,
  retry_count integer not null default 0 check (retry_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index marketing_event_outbox_claim_idx
  on public.marketing_event_outbox (status, lease_until, created_at);

create table public.admin_login_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);

create index admin_login_attempts_window_idx
  on public.admin_login_attempts (ip_hash, attempted_at desc);

alter table public.physical_sales
  add column order_ref_id uuid unique
    references public.olffy_order_refs(id) on delete set null;

create trigger olffy_order_refs_set_updated_at
before update on public.olffy_order_refs
for each row execute function public.loyalty_set_updated_at();

create trigger payment_events_set_updated_at
before update on public.payment_events
for each row execute function public.loyalty_set_updated_at();

create trigger tax_document_refs_set_updated_at
before update on public.tax_document_refs
for each row execute function public.loyalty_set_updated_at();

create or replace function public.claim_payment_event(
  p_idempotency_key text,
  p_provider_event_id text,
  p_received_total integer,
  p_currency text,
  p_lease_seconds integer default 120
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  event_record public.payment_events%rowtype;
  claim_token uuid := gen_random_uuid();
begin
  select *
    into event_record
    from public.payment_events
    where idempotency_key = p_idempotency_key
    for update;

  if not found then
    raise exception 'Unknown payment event';
  end if;

  if event_record.expected_total <> p_received_total
    or event_record.currency <> upper(trim(p_currency)) then
    update public.payment_events
      set received_total = p_received_total,
          provider_event_id = coalesce(provider_event_id, nullif(trim(p_provider_event_id), '')),
          status = 'manual_review',
          received_at = now(),
          last_error = 'Payment amount or currency does not match the expected operation'
      where id = event_record.id;

    return jsonb_build_object('status', 'manual_review');
  end if;

  if event_record.status = 'confirmed' then
    return jsonb_build_object(
      'status', 'confirmed',
      'already_completed', true,
      'payload_snapshot', event_record.payload_snapshot,
      'olffy_reference', event_record.olffy_reference,
      'payment_reference', event_record.payment_reference
    );
  end if;

  if event_record.status = 'processing'
    and event_record.lease_until is not null
    and event_record.lease_until > now() then
    return jsonb_build_object('status', 'processing', 'in_progress', true);
  end if;

  update public.payment_events
    set status = 'processing',
        received_total = p_received_total,
        provider_event_id = coalesce(provider_event_id, nullif(trim(p_provider_event_id), '')),
        received_at = now(),
        processing_token = claim_token,
        lease_until = now() + make_interval(secs => greatest(p_lease_seconds, 30)),
        retry_count = retry_count + 1,
        last_error = null
    where id = event_record.id;

  return jsonb_build_object(
    'status', 'processing',
    'claim_token', claim_token,
    'payload_snapshot', event_record.payload_snapshot,
    'olffy_reference', event_record.olffy_reference,
    'payment_reference', event_record.payment_reference
  );
end;
$$;

create or replace function public.complete_payment_event(
  p_idempotency_key text,
  p_claim_token uuid
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.payment_events
    set status = 'confirmed',
        processing_token = null,
        lease_until = null,
        processed_at = now(),
        last_error = null
    where idempotency_key = p_idempotency_key
      and processing_token = p_claim_token;

  if not found then
    raise exception 'Payment event claim is no longer valid';
  end if;
end;
$$;

create or replace function public.fail_payment_event(
  p_idempotency_key text,
  p_claim_token uuid,
  p_status text,
  p_error text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_status not in ('rejected', 'manual_review') then
    raise exception 'Invalid payment failure status';
  end if;

  update public.payment_events
    set status = p_status,
        processing_token = null,
        lease_until = null,
        last_error = left(coalesce(p_error, 'Unknown payment error'), 2000)
    where idempotency_key = p_idempotency_key
      and processing_token = p_claim_token;
end;
$$;

create or replace function public.claim_marketing_events(
  p_limit integer default 25,
  p_lease_seconds integer default 120
)
returns setof public.marketing_event_outbox
language plpgsql
set search_path = ''
as $$
declare
  claim_token uuid := gen_random_uuid();
begin
  return query
  update public.marketing_event_outbox as event
    set status = 'processing',
        processing_token = claim_token,
        lease_until = now() + make_interval(secs => greatest(p_lease_seconds, 30)),
        retry_count = retry_count + 1
    where event.id in (
      select candidate.id
      from public.marketing_event_outbox as candidate
      where candidate.status in ('pending', 'failed')
        and (candidate.lease_until is null or candidate.lease_until <= now())
      order by candidate.created_at
      for update skip locked
      limit least(greatest(p_limit, 1), 100)
    )
    returning event.*;
end;
$$;

alter table public.olffy_order_refs enable row level security;
alter table public.payment_events enable row level security;
alter table public.tax_document_refs enable row level security;
alter table public.marketing_event_outbox enable row level security;
alter table public.admin_login_attempts enable row level security;

revoke all on table
  public.olffy_order_refs,
  public.payment_events,
  public.tax_document_refs,
  public.marketing_event_outbox,
  public.admin_login_attempts
from anon, authenticated;

grant select, insert, update, delete on table
  public.olffy_order_refs,
  public.payment_events,
  public.tax_document_refs,
  public.marketing_event_outbox,
  public.admin_login_attempts
to service_role;

grant usage, select on sequence public.admin_login_attempts_id_seq
to service_role;

revoke all on function public.claim_payment_event(text, text, integer, text, integer)
  from public, anon, authenticated;
revoke all on function public.complete_payment_event(text, uuid)
  from public, anon, authenticated;
revoke all on function public.fail_payment_event(text, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.claim_marketing_events(integer, integer)
  from public, anon, authenticated;

grant execute on function public.claim_payment_event(text, text, integer, text, integer)
  to service_role;
grant execute on function public.complete_payment_event(text, uuid)
  to service_role;
grant execute on function public.fail_payment_event(text, uuid, text, text)
  to service_role;
grant execute on function public.claim_marketing_events(integer, integer)
  to service_role;
