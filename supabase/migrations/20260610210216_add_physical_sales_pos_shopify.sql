alter table public.loyalty_rules
  add column point_redemption_value_clp integer not null default 10
    check (point_redemption_value_clp > 0);

alter table public.physical_sales
  add column shopify_order_id text,
  add column shopify_order_name text,
  add column benefit_type text not null default 'none'
    check (benefit_type in ('none', 'points', 'discount_code', 'manual_discount')),
  add column benefit_amount numeric(12, 2) not null default 0
    check (benefit_amount >= 0),
  add column points_spent bigint not null default 0
    check (points_spent >= 0),
  add column discount_code text,
  add column manual_discount_reason text;

create unique index physical_sales_shopify_order_id_unique_idx
  on public.physical_sales (shopify_order_id)
  where shopify_order_id is not null;

drop index if exists public.loyalty_transactions_physical_sale_unique_idx;

create unique index loyalty_transactions_physical_sale_type_unique_idx
  on public.loyalty_transactions (physical_sale_id, transaction_type)
  where physical_sale_id is not null
    and transaction_type in ('earned', 'redeemed');

create table public.physical_sale_attempts (
  id uuid primary key default gen_random_uuid(),
  claim_token uuid not null default gen_random_uuid(),
  tuu_transaction_id text not null unique,
  payload_fingerprint text not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  shopify_order_id text,
  shopify_order_name text,
  physical_sale_id bigint
    references public.physical_sales(id) on delete restrict,
  last_error text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table public.physical_sale_attempts is
  'Coordina reintentos del POS TUU para evitar ordenes Shopify y puntos duplicados.';

create unique index physical_sale_attempts_shopify_order_id_unique_idx
  on public.physical_sale_attempts (shopify_order_id)
  where shopify_order_id is not null;

create index physical_sale_attempts_status_updated_at_idx
  on public.physical_sale_attempts (status, updated_at);

create trigger physical_sale_attempts_set_updated_at
before update on public.physical_sale_attempts
for each row execute function public.loyalty_set_updated_at();

create or replace function public.claim_physical_sale_pos_attempt(
  p_tuu_transaction_id text,
  p_payload_fingerprint text,
  p_created_by text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  attempt_record public.physical_sale_attempts%rowtype;
  new_claim_token uuid;
begin
  if nullif(trim(p_tuu_transaction_id), '') is null then
    raise exception 'A TUU transaction reference is required';
  end if;

  if nullif(trim(p_payload_fingerprint), '') is null then
    raise exception 'A sale payload fingerprint is required';
  end if;

  insert into public.physical_sale_attempts (
    tuu_transaction_id,
    payload_fingerprint,
    created_by
  )
  values (
    trim(p_tuu_transaction_id),
    trim(p_payload_fingerprint),
    nullif(trim(p_created_by), '')
  )
  on conflict (tuu_transaction_id) do nothing
  returning * into attempt_record;

  if found then
    return jsonb_build_object(
      'attempt_id', attempt_record.id,
      'claim_token', attempt_record.claim_token,
      'status', attempt_record.status,
      'shopify_order_id', attempt_record.shopify_order_id,
      'shopify_order_name', attempt_record.shopify_order_name,
      'physical_sale_id', attempt_record.physical_sale_id
    );
  end if;

  select *
    into attempt_record
    from public.physical_sale_attempts
    where tuu_transaction_id = trim(p_tuu_transaction_id)
    for update;

  if attempt_record.payload_fingerprint <> trim(p_payload_fingerprint) then
    raise exception 'The TUU reference is already associated with a different sale';
  end if;

  if attempt_record.status = 'completed' then
    return jsonb_build_object(
      'attempt_id', attempt_record.id,
      'status', attempt_record.status,
      'shopify_order_id', attempt_record.shopify_order_id,
      'shopify_order_name', attempt_record.shopify_order_name,
      'physical_sale_id', attempt_record.physical_sale_id
    );
  end if;

  if attempt_record.status = 'pending'
    and attempt_record.updated_at > now() - interval '2 minutes' then
    raise exception 'This TUU sale is already being processed';
  end if;

  new_claim_token := gen_random_uuid();

  update public.physical_sale_attempts
    set claim_token = new_claim_token,
        status = 'pending',
        last_error = null,
        created_by = coalesce(nullif(trim(p_created_by), ''), created_by)
    where id = attempt_record.id
    returning * into attempt_record;

  return jsonb_build_object(
    'attempt_id', attempt_record.id,
    'claim_token', attempt_record.claim_token,
    'status', attempt_record.status,
    'shopify_order_id', attempt_record.shopify_order_id,
    'shopify_order_name', attempt_record.shopify_order_name,
    'physical_sale_id', attempt_record.physical_sale_id
  );
end;
$$;

create or replace function public.fail_physical_sale_pos_attempt(
  p_attempt_id uuid,
  p_claim_token uuid,
  p_error text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.physical_sale_attempts
    set status = 'failed',
        last_error = left(coalesce(p_error, 'Unknown error'), 2000)
    where id = p_attempt_id
      and claim_token = p_claim_token
      and status = 'pending';
end;
$$;

create or replace function public.finalize_physical_sale_pos(
  p_attempt_id uuid,
  p_claim_token uuid,
  p_customer_id bigint,
  p_tuu_transaction_id text,
  p_receipt_number text,
  p_shopify_order_id text,
  p_shopify_order_name text,
  p_subtotal numeric,
  p_discount numeric,
  p_total numeric,
  p_benefit_type text,
  p_points_spent bigint,
  p_points_earned bigint,
  p_discount_code text,
  p_manual_discount_reason text,
  p_items jsonb,
  p_notes text,
  p_created_by text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  attempt_record public.physical_sale_attempts%rowtype;
  customer_record public.loyalty_customers%rowtype;
  existing_sale_id bigint;
  sale_id bigint;
  items_subtotal numeric(12, 2);
  redeemed_transaction_id bigint;
  earned_transaction_id bigint;
  rule_record public.loyalty_rules%rowtype;
  expected_points_earned bigint;
begin
  select *
    into attempt_record
    from public.physical_sale_attempts
    where id = p_attempt_id
    for update;

  if not found then
    raise exception 'Physical sale attempt does not exist';
  end if;

  if attempt_record.status = 'completed' then
    return jsonb_build_object(
      'physical_sale_id', attempt_record.physical_sale_id,
      'shopify_order_id', attempt_record.shopify_order_id,
      'shopify_order_name', attempt_record.shopify_order_name,
      'already_completed', true
    );
  end if;

  if attempt_record.claim_token <> p_claim_token
    or attempt_record.status <> 'pending' then
    raise exception 'Physical sale attempt is not owned by this request';
  end if;

  if attempt_record.tuu_transaction_id <> trim(p_tuu_transaction_id) then
    raise exception 'TUU reference does not match the claimed attempt';
  end if;

  select id
    into existing_sale_id
    from public.physical_sales
    where tuu_transaction_id = trim(p_tuu_transaction_id)
       or shopify_order_id = trim(p_shopify_order_id)
    limit 1;

  if found then
    update public.physical_sale_attempts
      set status = 'completed',
          shopify_order_id = trim(p_shopify_order_id),
          shopify_order_name = nullif(trim(p_shopify_order_name), ''),
          physical_sale_id = existing_sale_id,
          completed_at = now()
      where id = p_attempt_id;

    return jsonb_build_object(
      'physical_sale_id', existing_sale_id,
      'shopify_order_id', trim(p_shopify_order_id),
      'shopify_order_name', nullif(trim(p_shopify_order_name), ''),
      'already_completed', true
    );
  end if;

  if nullif(trim(p_shopify_order_id), '') is null then
    raise exception 'A Shopify order ID is required';
  end if;

  if p_benefit_type not in ('none', 'points', 'discount_code', 'manual_discount') then
    raise exception 'Unsupported benefit type %', p_benefit_type;
  end if;

  if p_subtotal <= 0 or p_total <= 0 then
    raise exception 'Physical sale subtotal and total must be greater than zero';
  end if;

  if p_discount < 0 or p_discount > p_subtotal or p_total <> p_subtotal - p_discount then
    raise exception 'Physical sale totals are inconsistent';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A physical sale requires at least one item';
  end if;

  select coalesce(sum(
    ((item ->> 'quantity')::integer) * ((item ->> 'unit_price')::numeric)
  ), 0)
    into items_subtotal
    from jsonb_array_elements(p_items) as item;

  if items_subtotal <> p_subtotal then
    raise exception 'Physical sale item subtotal (%) does not match sale subtotal (%)',
      items_subtotal, p_subtotal;
  end if;

  if p_customer_id is null and (p_points_spent <> 0 or p_points_earned <> 0) then
    raise exception 'An anonymous physical sale cannot move loyalty points';
  end if;

  if p_points_spent < 0 or p_points_earned < 0 then
    raise exception 'Physical sale point values cannot be negative';
  end if;

  if p_benefit_type = 'none' and (p_discount <> 0 or p_points_spent <> 0) then
    raise exception 'A sale without benefits cannot include a discount or spent points';
  end if;

  if p_benefit_type = 'points' then
    if p_customer_id is null or p_points_spent <= 0 or p_discount <= 0 then
      raise exception 'A points benefit requires a customer, points and discount';
    end if;
    if nullif(trim(p_discount_code), '') is not null then
      raise exception 'Points and discount codes cannot be combined';
    end if;
  elsif p_benefit_type = 'discount_code' then
    if p_points_spent <> 0
      or p_discount <= 0
      or nullif(trim(p_discount_code), '') is null then
      raise exception 'A discount code benefit requires a code and cannot spend points';
    end if;
  elsif p_benefit_type = 'manual_discount' then
    if p_points_spent <> 0
      or p_discount <= 0
      or nullif(trim(p_manual_discount_reason), '') is null then
      raise exception 'A manual discount requires authorization details and cannot spend points';
    end if;
  end if;

  select *
    into rule_record
    from public.loyalty_rules
    where is_active
    limit 1;

  if not found then
    raise exception 'No active loyalty rule is configured';
  end if;

  if p_benefit_type = 'points'
    and p_discount <> p_points_spent * rule_record.point_redemption_value_clp then
    raise exception 'Points discount does not match the active loyalty rule';
  end if;

  if p_customer_id is not null then
    select *
      into customer_record
      from public.loyalty_customers
      where id = p_customer_id
      for update;

    if not found then
      raise exception 'Loyalty customer % does not exist', p_customer_id;
    end if;

    if customer_record.status <> 'active' then
      raise exception 'Loyalty customer % is blocked', p_customer_id;
    end if;

    if customer_record.points_balance < p_points_spent then
      raise exception 'Insufficient points for customer %', p_customer_id;
    end if;

    expected_points_earned :=
      floor(p_total / rule_record.spending_unit_clp)
      * rule_record.points_per_unit;

    if p_points_earned <> expected_points_earned then
      raise exception 'Earned points do not match the active loyalty rule';
    end if;
  end if;

  insert into public.physical_sales (
    customer_id,
    tuu_transaction_id,
    receipt_number,
    shopify_order_id,
    shopify_order_name,
    subtotal,
    discount,
    total,
    benefit_type,
    benefit_amount,
    points_spent,
    points_earned,
    discount_code,
    manual_discount_reason,
    notes,
    created_by,
    metadata
  )
  values (
    p_customer_id,
    trim(p_tuu_transaction_id),
    nullif(trim(p_receipt_number), ''),
    trim(p_shopify_order_id),
    nullif(trim(p_shopify_order_name), ''),
    p_subtotal,
    p_discount,
    p_total,
    p_benefit_type,
    p_discount,
    p_points_spent,
    p_points_earned,
    nullif(trim(p_discount_code), ''),
    nullif(trim(p_manual_discount_reason), ''),
    nullif(trim(p_notes), ''),
    nullif(trim(p_created_by), ''),
    p_metadata
  )
  returning id into sale_id;

  insert into public.physical_sale_items (
    physical_sale_id,
    shopify_product_id,
    shopify_variant_id,
    sku,
    product_title,
    variant_title,
    quantity,
    unit_price
  )
  select
    sale_id,
    item ->> 'shopify_product_id',
    item ->> 'shopify_variant_id',
    nullif(item ->> 'sku', ''),
    item ->> 'product_title',
    nullif(item ->> 'variant_title', ''),
    (item ->> 'quantity')::integer,
    (item ->> 'unit_price')::numeric
  from jsonb_array_elements(p_items) as item;

  if p_points_spent > 0 then
    insert into public.loyalty_transactions (
      customer_id,
      transaction_type,
      points,
      source,
      external_reference,
      physical_sale_id,
      description,
      created_by,
      metadata
    )
    values (
      p_customer_id,
      'redeemed',
      -p_points_spent,
      'physical_sale',
      'physical_sale:' || sale_id || ':redeemed',
      sale_id,
      'Puntos usados en venta fisica TUU',
      nullif(trim(p_created_by), ''),
      jsonb_build_object('shopify_order_id', trim(p_shopify_order_id))
    )
    returning id into redeemed_transaction_id;
  end if;

  if p_points_earned > 0 then
    insert into public.loyalty_transactions (
      customer_id,
      transaction_type,
      points,
      source,
      external_reference,
      physical_sale_id,
      description,
      created_by,
      metadata
    )
    values (
      p_customer_id,
      'earned',
      p_points_earned,
      'physical_sale',
      'physical_sale:' || sale_id || ':earned',
      sale_id,
      'Puntos por venta fisica TUU',
      nullif(trim(p_created_by), ''),
      jsonb_build_object('shopify_order_id', trim(p_shopify_order_id))
    )
    returning id into earned_transaction_id;
  end if;

  insert into public.email_events (
    customer_id,
    event_type,
    recipient_email,
    payload
  )
  select
    p_customer_id,
    'physical_sale_registered',
    email,
    jsonb_build_object(
      'physical_sale_id', sale_id,
      'shopify_order_id', trim(p_shopify_order_id),
      'tuu_transaction_id', trim(p_tuu_transaction_id),
      'total', p_total,
      'points_spent', p_points_spent,
      'points_earned', p_points_earned
    )
  from public.loyalty_customers
  where id = p_customer_id;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    actor,
    new_data,
    metadata
  )
  values (
    'physical_sale',
    sale_id::text,
    'pos_sale_completed',
    nullif(trim(p_created_by), ''),
    jsonb_build_object(
      'customer_id', p_customer_id,
      'shopify_order_id', trim(p_shopify_order_id),
      'shopify_order_name', nullif(trim(p_shopify_order_name), ''),
      'tuu_transaction_id', trim(p_tuu_transaction_id),
      'subtotal', p_subtotal,
      'discount', p_discount,
      'total', p_total,
      'benefit_type', p_benefit_type,
      'points_spent', p_points_spent,
      'points_earned', p_points_earned,
      'redeemed_transaction_id', redeemed_transaction_id,
      'earned_transaction_id', earned_transaction_id,
      'anonymous', p_customer_id is null
    ),
    p_metadata
  );

  update public.physical_sale_attempts
    set status = 'completed',
        shopify_order_id = trim(p_shopify_order_id),
        shopify_order_name = nullif(trim(p_shopify_order_name), ''),
        physical_sale_id = sale_id,
        completed_at = now()
    where id = p_attempt_id;

  return jsonb_build_object(
    'physical_sale_id', sale_id,
    'shopify_order_id', trim(p_shopify_order_id),
    'shopify_order_name', nullif(trim(p_shopify_order_name), ''),
    'redeemed_transaction_id', redeemed_transaction_id,
    'earned_transaction_id', earned_transaction_id,
    'already_completed', false
  );
end;
$$;

alter table public.physical_sale_attempts enable row level security;

revoke all on table public.physical_sale_attempts from anon, authenticated;
grant select, insert, update, delete on table public.physical_sale_attempts
to service_role;

revoke all on function public.claim_physical_sale_pos_attempt(
  text, text, text
) from public, anon, authenticated;
revoke all on function public.fail_physical_sale_pos_attempt(
  uuid, uuid, text
) from public, anon, authenticated;
revoke all on function public.finalize_physical_sale_pos(
  uuid, uuid, bigint, text, text, text, text, numeric, numeric, numeric,
  text, bigint, bigint, text, text, jsonb, text, text, jsonb
) from public, anon, authenticated;

grant execute on function public.claim_physical_sale_pos_attempt(
  text, text, text
) to service_role;
grant execute on function public.fail_physical_sale_pos_attempt(
  uuid, uuid, text
) to service_role;
grant execute on function public.finalize_physical_sale_pos(
  uuid, uuid, bigint, text, text, text, text, numeric, numeric, numeric,
  text, bigint, bigint, text, text, jsonb, text, text, jsonb
) to service_role;
