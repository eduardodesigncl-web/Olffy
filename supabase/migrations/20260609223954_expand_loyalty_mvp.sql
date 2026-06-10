alter table public.loyalty_customers
  add column qr_token uuid not null default gen_random_uuid();

create unique index loyalty_customers_qr_token_unique_idx
  on public.loyalty_customers (qr_token);

alter table public.physical_sales
  alter column customer_id drop not null;

alter table public.rewards
  add column discount_amount_clp integer
    check (discount_amount_clp is null or discount_amount_clp > 0),
  add column minimum_purchase_clp integer not null default 0
    check (minimum_purchase_clp >= 0),
  add column validity_days integer not null default 30
    check (validity_days > 0);

alter table public.reward_redemptions
  add column expires_at timestamptz,
  add column cancelled_at timestamptz,
  add column cancellation_reason text;

create table public.loyalty_rules (
  id bigint generated always as identity primary key,
  name text not null,
  spending_unit_clp integer not null default 1000
    check (spending_unit_clp > 0),
  points_per_unit bigint not null default 10
    check (points_per_unit > 0),
  points_expiry_months integer not null default 12
    check (points_expiry_months > 0),
  redemption_expiry_days integer not null default 30
    check (redemption_expiry_days > 0),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index loyalty_rules_single_active_idx
  on public.loyalty_rules (is_active)
  where is_active;

create trigger loyalty_rules_set_updated_at
before update on public.loyalty_rules
for each row execute function public.loyalty_set_updated_at();

insert into public.loyalty_rules (
  name,
  spending_unit_clp,
  points_per_unit,
  points_expiry_months,
  redemption_expiry_days
)
values (
  'Regla base OLFFY',
  1000,
  10,
  12,
  30
);

insert into public.rewards (
  name,
  description,
  reward_type,
  points_cost,
  discount_amount_clp,
  validity_days
)
values
  ('$3.000 de descuento', 'Beneficio inicial OLFFY', 'discount', 300, 3000, 30),
  ('$5.000 de descuento', 'Beneficio inicial OLFFY', 'discount', 500, 5000, 30),
  ('$10.000 de descuento', 'Beneficio inicial OLFFY', 'discount', 1000, 10000, 30);

create or replace function public.adjust_loyalty_points(
  p_customer_id bigint,
  p_points bigint,
  p_reason text,
  p_created_by text,
  p_external_reference text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  transaction_id bigint;
  customer_status text;
begin
  if p_points = 0 then
    raise exception 'A points adjustment cannot be zero';
  end if;

  if nullif(trim(p_reason), '') is null then
    raise exception 'A points adjustment requires a reason';
  end if;

  if nullif(trim(p_created_by), '') is null then
    raise exception 'A points adjustment requires a responsible actor';
  end if;

  select status
    into customer_status
    from public.loyalty_customers
    where id = p_customer_id
    for update;

  if not found then
    raise exception 'Loyalty customer % does not exist', p_customer_id;
  end if;

  if customer_status <> 'active' then
    raise exception 'Loyalty customer % is blocked', p_customer_id;
  end if;

  insert into public.loyalty_transactions (
    customer_id,
    transaction_type,
    points,
    source,
    external_reference,
    description,
    created_by,
    metadata
  )
  values (
    p_customer_id,
    'adjusted',
    p_points,
    'manual',
    nullif(trim(p_external_reference), ''),
    trim(p_reason),
    trim(p_created_by),
    p_metadata
  )
  returning id into transaction_id;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    actor,
    new_data
  )
  values (
    'loyalty_transaction',
    transaction_id::text,
    'manual_adjustment',
    trim(p_created_by),
    jsonb_build_object(
      'customer_id', p_customer_id,
      'points', p_points,
      'reason', trim(p_reason),
      'external_reference', nullif(trim(p_external_reference), '')
    )
  );

  return transaction_id;
end;
$$;

create or replace function public.reverse_loyalty_transaction(
  p_transaction_id bigint,
  p_reason text,
  p_created_by text
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  original_transaction public.loyalty_transactions%rowtype;
  reversal_id bigint;
begin
  if nullif(trim(p_reason), '') is null then
    raise exception 'A reversal requires a reason';
  end if;

  if nullif(trim(p_created_by), '') is null then
    raise exception 'A reversal requires a responsible actor';
  end if;

  select *
    into original_transaction
    from public.loyalty_transactions
    where id = p_transaction_id
    for update;

  if not found then
    raise exception 'Loyalty transaction % does not exist', p_transaction_id;
  end if;

  if original_transaction.transaction_type = 'reversed' then
    raise exception 'A reversal transaction cannot be reversed';
  end if;

  insert into public.loyalty_transactions (
    customer_id,
    transaction_type,
    points,
    source,
    external_reference,
    description,
    created_by,
    metadata
  )
  values (
    original_transaction.customer_id,
    'reversed',
    -original_transaction.points,
    'system',
    'reversal:' || original_transaction.id,
    trim(p_reason),
    trim(p_created_by),
    jsonb_build_object(
      'original_transaction_id', original_transaction.id,
      'original_source', original_transaction.source
    )
  )
  returning id into reversal_id;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    actor,
    old_data,
    new_data
  )
  values (
    'loyalty_transaction',
    original_transaction.id::text,
    'reversed',
    trim(p_created_by),
    to_jsonb(original_transaction),
    jsonb_build_object(
      'reversal_transaction_id', reversal_id,
      'reason', trim(p_reason)
    )
  );

  return reversal_id;
end;
$$;

create or replace function public.redeem_loyalty_reward(
  p_customer_id bigint,
  p_reward_id bigint,
  p_created_by text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  customer_record public.loyalty_customers%rowtype;
  reward_record public.rewards%rowtype;
  points_transaction_id bigint;
  redemption_id bigint;
  generated_code text;
  expiration timestamptz;
begin
  if nullif(trim(p_created_by), '') is null then
    raise exception 'A redemption requires a responsible actor';
  end if;

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

  select *
    into reward_record
    from public.rewards
    where id = p_reward_id
    for update;

  if not found or not reward_record.is_active then
    raise exception 'Reward % is not available', p_reward_id;
  end if;

  if customer_record.points_balance < reward_record.points_cost then
    raise exception 'Insufficient points for customer %', p_customer_id;
  end if;

  generated_code := 'OLFFY-' || upper(substr(
    md5(random()::text || clock_timestamp()::text || p_customer_id::text),
    1,
    10
  ));
  expiration := now() + make_interval(days => reward_record.validity_days);

  insert into public.loyalty_transactions (
    customer_id,
    transaction_type,
    points,
    source,
    external_reference,
    description,
    created_by,
    metadata
  )
  values (
    p_customer_id,
    'redeemed',
    -reward_record.points_cost,
    'reward_redemption',
    'reward:' || reward_record.id || ':' || generated_code,
    'Canje de ' || reward_record.name,
    trim(p_created_by),
    p_metadata
  )
  returning id into points_transaction_id;

  insert into public.reward_redemptions (
    customer_id,
    reward_id,
    loyalty_transaction_id,
    points_spent,
    status,
    redemption_code,
    metadata,
    expires_at
  )
  values (
    p_customer_id,
    p_reward_id,
    points_transaction_id,
    reward_record.points_cost,
    'requested',
    generated_code,
    p_metadata,
    expiration
  )
  returning id into redemption_id;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    actor,
    new_data
  )
  values (
    'reward_redemption',
    redemption_id::text,
    'created',
    trim(p_created_by),
    jsonb_build_object(
      'customer_id', p_customer_id,
      'reward_id', p_reward_id,
      'points_spent', reward_record.points_cost,
      'redemption_code', generated_code,
      'expires_at', expiration
    )
  );

  insert into public.email_events (
    customer_id,
    event_type,
    recipient_email,
    payload
  )
  values (
    p_customer_id,
    'reward_redemption_created',
    customer_record.email,
    jsonb_build_object(
      'redemption_id', redemption_id,
      'reward_id', p_reward_id,
      'redemption_code', generated_code,
      'expires_at', expiration
    )
  );

  return jsonb_build_object(
    'redemption_id', redemption_id,
    'transaction_id', points_transaction_id,
    'redemption_code', generated_code,
    'expires_at', expiration
  );
end;
$$;

create or replace function public.update_reward_redemption_status(
  p_redemption_id bigint,
  p_status text,
  p_created_by text
)
returns public.reward_redemptions
language plpgsql
set search_path = ''
as $$
declare
  redemption_record public.reward_redemptions%rowtype;
  updated_record public.reward_redemptions%rowtype;
begin
  if p_status not in ('approved', 'fulfilled') then
    raise exception 'Unsupported redemption status %', p_status;
  end if;

  if nullif(trim(p_created_by), '') is null then
    raise exception 'Changing a redemption requires a responsible actor';
  end if;

  select *
    into redemption_record
    from public.reward_redemptions
    where id = p_redemption_id
    for update;

  if not found then
    raise exception 'Reward redemption % does not exist', p_redemption_id;
  end if;

  if redemption_record.status in ('cancelled', 'fulfilled') then
    raise exception 'Reward redemption % is already closed', p_redemption_id;
  end if;

  update public.reward_redemptions
    set status = p_status,
        fulfilled_at = case when p_status = 'fulfilled' then now() else fulfilled_at end
    where id = p_redemption_id
    returning * into updated_record;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    actor,
    old_data,
    new_data
  )
  values (
    'reward_redemption',
    p_redemption_id::text,
    'status_changed',
    trim(p_created_by),
    to_jsonb(redemption_record),
    to_jsonb(updated_record)
  );

  return updated_record;
end;
$$;

create or replace function public.cancel_reward_redemption(
  p_redemption_id bigint,
  p_reason text,
  p_created_by text
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  redemption_record public.reward_redemptions%rowtype;
  reversal_id bigint;
begin
  if nullif(trim(p_reason), '') is null then
    raise exception 'Cancelling a redemption requires a reason';
  end if;

  if nullif(trim(p_created_by), '') is null then
    raise exception 'Cancelling a redemption requires a responsible actor';
  end if;

  select *
    into redemption_record
    from public.reward_redemptions
    where id = p_redemption_id
    for update;

  if not found then
    raise exception 'Reward redemption % does not exist', p_redemption_id;
  end if;

  if redemption_record.status = 'cancelled' then
    raise exception 'Reward redemption % is already cancelled', p_redemption_id;
  end if;

  if redemption_record.status = 'fulfilled' then
    raise exception 'A fulfilled redemption cannot be cancelled';
  end if;

  insert into public.loyalty_transactions (
    customer_id,
    transaction_type,
    points,
    source,
    external_reference,
    description,
    created_by,
    metadata
  )
  values (
    redemption_record.customer_id,
    'reversed',
    redemption_record.points_spent,
    'reward_redemption',
    'redemption_cancel:' || redemption_record.id,
    trim(p_reason),
    trim(p_created_by),
    jsonb_build_object(
      'redemption_id', redemption_record.id,
      'original_transaction_id', redemption_record.loyalty_transaction_id
    )
  )
  returning id into reversal_id;

  update public.reward_redemptions
    set status = 'cancelled',
        cancelled_at = now(),
        cancellation_reason = trim(p_reason)
    where id = p_redemption_id;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    actor,
    old_data,
    new_data
  )
  values (
    'reward_redemption',
    p_redemption_id::text,
    'cancelled',
    trim(p_created_by),
    to_jsonb(redemption_record),
    jsonb_build_object(
      'reversal_transaction_id', reversal_id,
      'reason', trim(p_reason)
    )
  );

  return reversal_id;
end;
$$;

create or replace function public.register_physical_sale(
  p_customer_id bigint,
  p_tuu_transaction_id text,
  p_receipt_number text,
  p_subtotal numeric,
  p_discount numeric,
  p_total numeric,
  p_items jsonb,
  p_points_earned bigint default 0,
  p_notes text default null,
  p_created_by text default null,
  p_sold_at timestamptz default now(),
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  sale_id bigint;
  items_subtotal numeric(12, 2);
begin
  if p_total <= 0 then
    raise exception 'A physical sale total must be greater than zero';
  end if;

  if p_customer_id is null and p_points_earned <> 0 then
    raise exception 'An anonymous physical sale cannot earn points';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Physical sale items must be a JSON array';
  end if;

  if jsonb_array_length(p_items) > 0 then
    select coalesce(sum(
      ((item ->> 'quantity')::integer) * ((item ->> 'unit_price')::numeric)
    ), 0)
      into items_subtotal
      from jsonb_array_elements(p_items) as item;

    if items_subtotal <> p_subtotal then
      raise exception 'Physical sale item subtotal (%) does not match sale subtotal (%)',
        items_subtotal, p_subtotal;
    end if;
  end if;

  insert into public.physical_sales (
    customer_id,
    tuu_transaction_id,
    receipt_number,
    subtotal,
    discount,
    total,
    points_earned,
    notes,
    sold_at,
    created_by,
    metadata
  )
  values (
    p_customer_id,
    trim(p_tuu_transaction_id),
    nullif(trim(p_receipt_number), ''),
    p_subtotal,
    p_discount,
    p_total,
    p_points_earned,
    nullif(trim(p_notes), ''),
    p_sold_at,
    nullif(trim(p_created_by), ''),
    p_metadata
  )
  returning id into sale_id;

  if jsonb_array_length(p_items) > 0 then
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
      nullif(item ->> 'shopify_variant_id', ''),
      nullif(item ->> 'sku', ''),
      item ->> 'product_title',
      nullif(item ->> 'variant_title', ''),
      (item ->> 'quantity')::integer,
      (item ->> 'unit_price')::numeric
    from jsonb_array_elements(p_items) as item;
  end if;

  if p_points_earned > 0 then
    insert into public.loyalty_transactions (
      customer_id,
      transaction_type,
      points,
      balance_after,
      source,
      external_reference,
      physical_sale_id,
      description,
      created_by
    )
    values (
      p_customer_id,
      'earned',
      p_points_earned,
      0,
      'physical_sale',
      trim(p_tuu_transaction_id),
      sale_id,
      'Puntos por venta fisica TUU',
      nullif(trim(p_created_by), '')
    );
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
      'tuu_transaction_id', trim(p_tuu_transaction_id),
      'total', p_total,
      'points_earned', p_points_earned
    )
  from public.loyalty_customers
  where id = p_customer_id;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    actor,
    new_data
  )
  values (
    'physical_sale',
    sale_id::text,
    'created',
    nullif(trim(p_created_by), ''),
    jsonb_build_object(
      'customer_id', p_customer_id,
      'tuu_transaction_id', trim(p_tuu_transaction_id),
      'total', p_total,
      'points_earned', p_points_earned,
      'anonymous', p_customer_id is null
    )
  );

  return sale_id;
end;
$$;

alter table public.loyalty_rules enable row level security;

revoke all on table public.loyalty_rules from anon, authenticated;

grant select, insert, update, delete on table public.loyalty_rules
to service_role;

grant usage, select on sequence public.loyalty_rules_id_seq
to service_role;

revoke all on function public.adjust_loyalty_points(
  bigint, bigint, text, text, text, jsonb
) from public, anon, authenticated;
revoke all on function public.reverse_loyalty_transaction(
  bigint, text, text
) from public, anon, authenticated;
revoke all on function public.redeem_loyalty_reward(
  bigint, bigint, text, jsonb
) from public, anon, authenticated;
revoke all on function public.update_reward_redemption_status(
  bigint, text, text
) from public, anon, authenticated;
revoke all on function public.cancel_reward_redemption(
  bigint, text, text
) from public, anon, authenticated;

grant execute on function public.adjust_loyalty_points(
  bigint, bigint, text, text, text, jsonb
) to service_role;
grant execute on function public.reverse_loyalty_transaction(
  bigint, text, text
) to service_role;
grant execute on function public.redeem_loyalty_reward(
  bigint, bigint, text, jsonb
) to service_role;
grant execute on function public.update_reward_redemption_status(
  bigint, text, text
) to service_role;
grant execute on function public.cancel_reward_redemption(
  bigint, text, text
) to service_role;
