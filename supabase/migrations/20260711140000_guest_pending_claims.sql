-- Reclamación de puntos por compra invitada (plan maestro S4-03):
-- una orden pagada con correo pero sin cuenta genera una reclamación pendiente
-- ligada a order_id + correo normalizado. Si el cliente crea y verifica una
-- cuenta con ese mismo correo dentro de 15 días, los puntos se activan
-- conservando la fecha original de compra (y con ella su vencimiento de lote).

create table public.loyalty_pending_claims (
  id bigint generated always as identity primary key,
  shopify_order_id text not null,
  order_ref_id uuid
    references public.olffy_order_refs(id) on delete set null,
  email text not null,
  points bigint not null check (points > 0),
  eligible_total numeric(12, 2),
  purchased_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'claimed', 'expired')),
  claimed_customer_id bigint
    references public.loyalty_customers(id) on delete set null,
  claimed_transaction_id bigint
    references public.loyalty_transactions(id) on delete set null,
  claimed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una orden no genera dos reclamaciones.
create unique index loyalty_pending_claims_order_unique_idx
  on public.loyalty_pending_claims (shopify_order_id);
create index loyalty_pending_claims_email_idx
  on public.loyalty_pending_claims (lower(email), status);
create index loyalty_pending_claims_expiry_idx
  on public.loyalty_pending_claims (expires_at)
  where status = 'pending';

create trigger loyalty_pending_claims_set_updated_at
before update on public.loyalty_pending_claims
for each row execute function public.loyalty_set_updated_at();

alter table public.loyalty_pending_claims enable row level security;
revoke all on table public.loyalty_pending_claims from anon, authenticated;

-- Activa las reclamaciones vigentes de un correo al verificar la cuenta.
-- Idempotente: la transacción earned usa la misma referencia externa que el
-- flujo online, así una orden nunca acredita puntos dos veces.
create or replace function public.claim_guest_loyalty_points(
  p_customer_id bigint,
  p_email text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  claim record;
  new_transaction_id bigint;
  claimed_count integer := 0;
  claimed_points bigint := 0;
begin
  if p_customer_id is null or nullif(trim(p_email), '') is null then
    return jsonb_build_object('claimed', 0, 'points', 0);
  end if;

  for claim in
    select *
      from public.loyalty_pending_claims
      where lower(email) = lower(trim(p_email))
        and status = 'pending'
      order by purchased_at
      for update skip locked
  loop
    -- Reclamación vencida (15 días): conserva el registro histórico pero
    -- bloquea su uso.
    if claim.expires_at <= now() then
      update public.loyalty_pending_claims
        set status = 'expired'
        where id = claim.id;
      continue;
    end if;

    -- Fecha de acumulación = fecha original de compra: el vencimiento del
    -- lote (6 meses) corre desde la compra, no desde la activación.
    insert into public.loyalty_transactions (
      customer_id,
      transaction_type,
      points,
      source,
      external_reference,
      description,
      created_by,
      created_at,
      metadata
    )
    values (
      p_customer_id,
      'earned',
      claim.points,
      'shopify_order',
      'loyalty:' || claim.shopify_order_id || ':earned',
      'Puntos de compra como invitado reclamados',
      'system:guest_claim',
      claim.purchased_at,
      jsonb_build_object(
        'pending_claim_id', claim.id,
        'claimed_at', now()
      )
    )
    on conflict (source, external_reference) where external_reference is not null
    do nothing
    returning id into new_transaction_id;

    update public.loyalty_pending_claims
      set status = 'claimed',
          claimed_customer_id = p_customer_id,
          claimed_transaction_id = new_transaction_id,
          claimed_at = now()
      where id = claim.id;

    if claim.order_ref_id is not null then
      update public.olffy_order_refs
        set loyalty_customer_id = p_customer_id,
            loyalty_status = 'processed',
            points_earned = claim.points
        where id = claim.order_ref_id;
    end if;

    if new_transaction_id is not null then
      claimed_count := claimed_count + 1;
      claimed_points := claimed_points + claim.points;
    end if;
  end loop;

  if claimed_count > 0 then
    insert into public.email_events (customer_id, event_type, recipient_email, payload)
    values (
      p_customer_id,
      'guest_points_activated',
      lower(trim(p_email)),
      jsonb_build_object('claims', claimed_count, 'points', claimed_points)
    );

    insert into public.audit_log (entity_type, entity_id, action, actor, new_data)
    values (
      'loyalty_customer',
      p_customer_id::text,
      'guest_points_claimed',
      'system:guest_claim',
      jsonb_build_object('claims', claimed_count, 'points', claimed_points)
    );
  end if;

  return jsonb_build_object('claimed', claimed_count, 'points', claimed_points);
end;
$$;

-- Expira reclamaciones no verificadas después de 15 días (histórico intacto).
create or replace function public.expire_guest_loyalty_claims()
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  expired_count integer;
begin
  with expired as (
    update public.loyalty_pending_claims
      set status = 'expired'
      where status = 'pending' and expires_at <= now()
      returning id
  )
  select count(*) into expired_count from expired;

  return jsonb_build_object('expired_claims', expired_count, 'ran_at', now());
end;
$$;

revoke all on function public.claim_guest_loyalty_points(bigint, text)
  from public, anon, authenticated;
revoke all on function public.expire_guest_loyalty_claims()
  from public, anon, authenticated;
