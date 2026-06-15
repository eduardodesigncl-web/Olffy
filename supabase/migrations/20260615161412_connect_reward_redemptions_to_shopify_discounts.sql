alter table public.reward_redemptions
  add column shopify_discount_node_id text,
  add column shopify_discount_code text,
  add column shopify_discount_status text,
  add column shopify_discount_created_at timestamptz,
  add column shopify_discount_ends_at timestamptz,
  add column shopify_discount_deactivated_at timestamptz,
  add column shopify_discount_usage_count integer not null default 0
    check (shopify_discount_usage_count >= 0),
  add column shopify_discount_last_error text;

create unique index reward_redemptions_shopify_discount_node_unique_idx
  on public.reward_redemptions (shopify_discount_node_id)
  where shopify_discount_node_id is not null;

create unique index reward_redemptions_shopify_discount_code_unique_idx
  on public.reward_redemptions (upper(shopify_discount_code))
  where shopify_discount_code is not null;

alter table public.reward_redemptions
  drop constraint reward_redemptions_status_check,
  add constraint reward_redemptions_status_check
    check (
      status in (
        'requested',
        'creating',
        'approved',
        'cancelling',
        'fulfilled',
        'cancelled',
        'expired',
        'reconciliation_required'
      )
    );

comment on column public.reward_redemptions.shopify_discount_status is
  'Estado de conciliacion con Shopify: creating, active, checking_usage, deactivating, deactivated, used, expired, creation_failed o reconciliation_required.';

comment on column public.reward_redemptions.shopify_discount_ends_at is
  'La vigencia se calcula desde la aprobacion. Un descuento vencido y sin usos devuelve puntos cuando se procesa su conciliacion.';

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

  if original_transaction.source = 'reward_redemption' then
    raise exception 'Reward redemption transactions must use the Shopify-aware cancellation workflow';
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

  if reward_record.reward_type <> 'discount'
    or reward_record.discount_amount_clp is null then
    raise exception 'Reward % is not a Shopify discount', p_reward_id;
  end if;

  if customer_record.points_balance < reward_record.points_cost then
    raise exception 'Insufficient points for customer %', p_customer_id;
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
    'redeemed',
    -reward_record.points_cost,
    'reward_redemption',
    'reward:' || reward_record.id || ':request:' || gen_random_uuid()::text,
    'Reserva para canje de ' || reward_record.name,
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
    null,
    p_metadata,
    null
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
    'requested',
    trim(p_created_by),
    jsonb_build_object(
      'customer_id', p_customer_id,
      'reward_id', p_reward_id,
      'points_reserved', reward_record.points_cost
    )
  );

  return jsonb_build_object(
    'redemption_id', redemption_id,
    'transaction_id', points_transaction_id
  );
end;
$$;

create or replace function public.begin_reward_redemption_approval(
  p_redemption_id bigint,
  p_created_by text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  redemption_record public.reward_redemptions%rowtype;
  reward_record public.rewards%rowtype;
  customer_record public.loyalty_customers%rowtype;
  generated_code text;
begin
  if nullif(trim(p_created_by), '') is null then
    raise exception 'Approving a redemption requires a responsible actor';
  end if;

  select *
    into redemption_record
    from public.reward_redemptions
    where id = p_redemption_id
    for update;

  if not found then
    raise exception 'Reward redemption % does not exist', p_redemption_id;
  end if;

  if redemption_record.status <> 'requested' then
    raise exception 'Reward redemption % is not pending approval', p_redemption_id;
  end if;

  select *
    into reward_record
    from public.rewards
    where id = redemption_record.reward_id;

  select *
    into customer_record
    from public.loyalty_customers
    where id = redemption_record.customer_id;

  if reward_record.reward_type <> 'discount'
    or reward_record.discount_amount_clp is null then
    raise exception 'Reward % is not a Shopify discount', reward_record.id;
  end if;

  generated_code := 'OLFFY-' || redemption_record.id || '-' || upper(substr(
    md5(random()::text || clock_timestamp()::text || redemption_record.id::text),
    1,
    8
  ));

  update public.reward_redemptions
    set status = 'creating',
        shopify_discount_code = generated_code,
        shopify_discount_status = 'creating',
        shopify_discount_last_error = null
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
    'shopify_discount_creation_started',
    trim(p_created_by),
    to_jsonb(redemption_record),
    jsonb_build_object('shopify_discount_code', generated_code)
  );

  return jsonb_build_object(
    'redemption_id', redemption_record.id,
    'reward_name', reward_record.name,
    'discount_amount_clp', reward_record.discount_amount_clp,
    'minimum_purchase_clp', reward_record.minimum_purchase_clp,
    'validity_days', reward_record.validity_days,
    'shopify_customer_id', customer_record.shopify_customer_id,
    'shopify_discount_code', generated_code
  );
end;
$$;

create or replace function public.complete_reward_redemption_approval(
  p_redemption_id bigint,
  p_shopify_discount_node_id text,
  p_shopify_discount_created_at timestamptz,
  p_shopify_discount_ends_at timestamptz,
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
  if nullif(trim(p_shopify_discount_node_id), '') is null then
    raise exception 'Shopify discount node ID is required';
  end if;

  if p_shopify_discount_ends_at <= p_shopify_discount_created_at then
    raise exception 'Shopify discount expiration must be after creation';
  end if;

  select *
    into redemption_record
    from public.reward_redemptions
    where id = p_redemption_id
    for update;

  if not found or redemption_record.status <> 'creating' then
    raise exception 'Reward redemption % is not creating a discount', p_redemption_id;
  end if;

  update public.reward_redemptions
    set status = 'approved',
        redemption_code = shopify_discount_code,
        expires_at = p_shopify_discount_ends_at,
        shopify_discount_node_id = trim(p_shopify_discount_node_id),
        shopify_discount_status = 'active',
        shopify_discount_created_at = p_shopify_discount_created_at,
        shopify_discount_ends_at = p_shopify_discount_ends_at,
        shopify_discount_last_error = null
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
    'approved_with_shopify_discount',
    trim(p_created_by),
    to_jsonb(redemption_record),
    to_jsonb(updated_record)
  );

  return updated_record;
end;
$$;

create or replace function public.fail_reward_redemption_approval(
  p_redemption_id bigint,
  p_error text,
  p_requires_reconciliation boolean,
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
  select *
    into redemption_record
    from public.reward_redemptions
    where id = p_redemption_id
    for update;

  if not found or redemption_record.status not in ('creating', 'reconciliation_required') then
    raise exception 'Reward redemption % cannot record an approval failure', p_redemption_id;
  end if;

  update public.reward_redemptions
    set status = case
          when p_requires_reconciliation then 'reconciliation_required'
          else 'requested'
        end,
        shopify_discount_status = case
          when p_requires_reconciliation then 'reconciliation_required'
          else 'creation_failed'
        end,
        shopify_discount_code = case
          when p_requires_reconciliation then shopify_discount_code
          else null
        end,
        shopify_discount_last_error = left(coalesce(p_error, 'Unknown error'), 2000)
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
    'shopify_discount_creation_failed',
    trim(p_created_by),
    to_jsonb(redemption_record),
    to_jsonb(updated_record)
  );

  return updated_record;
end;
$$;

create or replace function public.begin_reward_redemption_cancellation(
  p_redemption_id bigint,
  p_reason text,
  p_created_by text
)
returns jsonb
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

  if redemption_record.status = 'requested' then
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

    return jsonb_build_object(
      'requires_shopify', false,
      'reversal_transaction_id', reversal_id
    );
  end if;

  if redemption_record.status <> 'approved' then
    raise exception 'Reward redemption % cannot be cancelled from status %',
      p_redemption_id,
      redemption_record.status;
  end if;

  if redemption_record.shopify_discount_node_id is null then
    raise exception 'Approved redemption % has no Shopify discount ID', p_redemption_id;
  end if;

  update public.reward_redemptions
    set status = 'cancelling',
        shopify_discount_status = 'checking_usage',
        shopify_discount_last_error = null,
        cancellation_reason = trim(p_reason)
    where id = p_redemption_id;

  return jsonb_build_object(
    'requires_shopify', true,
    'shopify_discount_node_id', redemption_record.shopify_discount_node_id,
    'shopify_discount_code', redemption_record.shopify_discount_code,
    'shopify_discount_ends_at', redemption_record.shopify_discount_ends_at
  );
end;
$$;

create or replace function public.complete_reward_redemption_cancellation(
  p_redemption_id bigint,
  p_reason text,
  p_created_by text,
  p_expired boolean default false
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  redemption_record public.reward_redemptions%rowtype;
  reversal_id bigint;
begin
  select *
    into redemption_record
    from public.reward_redemptions
    where id = p_redemption_id
    for update;

  if not found or redemption_record.status <> 'cancelling' then
    raise exception 'Reward redemption % is not being cancelled', p_redemption_id;
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
    case
      when p_expired then 'redemption_expired:' || redemption_record.id
      else 'redemption_cancel:' || redemption_record.id
    end,
    trim(p_reason),
    trim(p_created_by),
    jsonb_build_object(
      'redemption_id', redemption_record.id,
      'original_transaction_id', redemption_record.loyalty_transaction_id,
      'shopify_discount_node_id', redemption_record.shopify_discount_node_id
    )
  )
  returning id into reversal_id;

  update public.reward_redemptions
    set status = case when p_expired then 'expired' else 'cancelled' end,
        cancelled_at = now(),
        cancellation_reason = trim(p_reason),
        shopify_discount_status = case
          when p_expired then 'expired'
          else 'deactivated'
        end,
        shopify_discount_deactivated_at = now(),
        shopify_discount_usage_count = 0,
        shopify_discount_last_error = null
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
    case when p_expired then 'expired_unused_refunded' else 'cancelled_refunded' end,
    trim(p_created_by),
    to_jsonb(redemption_record),
    jsonb_build_object('reversal_transaction_id', reversal_id)
  );

  return reversal_id;
end;
$$;

create or replace function public.fail_reward_redemption_cancellation(
  p_redemption_id bigint,
  p_error text,
  p_created_by text
)
returns public.reward_redemptions
language plpgsql
set search_path = ''
as $$
declare
  updated_record public.reward_redemptions%rowtype;
begin
  update public.reward_redemptions
    set status = 'approved',
        shopify_discount_status = 'active',
        shopify_discount_last_error = left(coalesce(p_error, 'Unknown error'), 2000)
    where id = p_redemption_id
      and status = 'cancelling'
    returning * into updated_record;

  if not found then
    raise exception 'Reward redemption % is not being cancelled', p_redemption_id;
  end if;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    actor,
    new_data
  )
  values (
    'reward_redemption',
    p_redemption_id::text,
    'shopify_discount_cancellation_failed',
    trim(p_created_by),
    to_jsonb(updated_record)
  );

  return updated_record;
end;
$$;

create or replace function public.mark_reward_redemption_used(
  p_redemption_id bigint,
  p_usage_count integer,
  p_created_by text
)
returns public.reward_redemptions
language plpgsql
set search_path = ''
as $$
declare
  updated_record public.reward_redemptions%rowtype;
begin
  if p_usage_count < 1 then
    raise exception 'A used redemption requires a positive usage count';
  end if;

  update public.reward_redemptions
    set status = 'fulfilled',
        fulfilled_at = now(),
        shopify_discount_status = 'used',
        shopify_discount_usage_count = p_usage_count,
        shopify_discount_last_error = null
    where id = p_redemption_id
      and status in ('approved', 'cancelling')
    returning * into updated_record;

  if not found then
    raise exception 'Reward redemption % cannot be marked as used', p_redemption_id;
  end if;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    actor,
    new_data
  )
  values (
    'reward_redemption',
    p_redemption_id::text,
    'shopify_discount_used',
    trim(p_created_by),
    to_jsonb(updated_record)
  );

  return updated_record;
end;
$$;

create or replace function public.mark_reward_redemption_reconciliation_required(
  p_redemption_id bigint,
  p_error text,
  p_created_by text
)
returns public.reward_redemptions
language plpgsql
set search_path = ''
as $$
declare
  updated_record public.reward_redemptions%rowtype;
begin
  update public.reward_redemptions
    set status = 'reconciliation_required',
        shopify_discount_status = 'reconciliation_required',
        shopify_discount_last_error = left(coalesce(p_error, 'Unknown error'), 2000)
    where id = p_redemption_id
      and status in ('creating', 'approved', 'cancelling', 'reconciliation_required')
    returning * into updated_record;

  if not found then
    raise exception 'Reward redemption % cannot require reconciliation', p_redemption_id;
  end if;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    actor,
    new_data
  )
  values (
    'reward_redemption',
    p_redemption_id::text,
    'reconciliation_required',
    trim(p_created_by),
    to_jsonb(updated_record)
  );

  return updated_record;
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
begin
  raise exception 'Use Shopify usage verification before fulfilling a redemption';
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
begin
  raise exception 'Use the Shopify-aware cancellation workflow';
end;
$$;

revoke all on function public.reverse_loyalty_transaction(bigint, text, text)
  from public, anon, authenticated;
revoke all on function public.update_reward_redemption_status(bigint, text, text)
  from public, anon, authenticated;
revoke all on function public.cancel_reward_redemption(bigint, text, text)
  from public, anon, authenticated;
revoke all on function public.begin_reward_redemption_approval(bigint, text)
  from public, anon, authenticated;
revoke all on function public.complete_reward_redemption_approval(
  bigint,
  text,
  timestamptz,
  timestamptz,
  text
) from public, anon, authenticated;
revoke all on function public.fail_reward_redemption_approval(
  bigint,
  text,
  boolean,
  text
) from public, anon, authenticated;
revoke all on function public.begin_reward_redemption_cancellation(
  bigint,
  text,
  text
) from public, anon, authenticated;
revoke all on function public.complete_reward_redemption_cancellation(
  bigint,
  text,
  text,
  boolean
) from public, anon, authenticated;
revoke all on function public.fail_reward_redemption_cancellation(
  bigint,
  text,
  text
) from public, anon, authenticated;
revoke all on function public.mark_reward_redemption_used(bigint, integer, text)
  from public, anon, authenticated;
revoke all on function public.mark_reward_redemption_reconciliation_required(
  bigint,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.begin_reward_redemption_approval(bigint, text)
  to service_role;
grant execute on function public.complete_reward_redemption_approval(
  bigint,
  text,
  timestamptz,
  timestamptz,
  text
) to service_role;
grant execute on function public.fail_reward_redemption_approval(
  bigint,
  text,
  boolean,
  text
) to service_role;
grant execute on function public.begin_reward_redemption_cancellation(
  bigint,
  text,
  text
) to service_role;
grant execute on function public.complete_reward_redemption_cancellation(
  bigint,
  text,
  text,
  boolean
) to service_role;
grant execute on function public.fail_reward_redemption_cancellation(
  bigint,
  text,
  text
) to service_role;
grant execute on function public.mark_reward_redemption_used(bigint, integer, text)
  to service_role;
grant execute on function public.mark_reward_redemption_reconciliation_required(
  bigint,
  text,
  text
) to service_role;
grant execute on function public.reverse_loyalty_transaction(bigint, text, text)
  to service_role;
grant execute on function public.update_reward_redemption_status(bigint, text, text)
  to service_role;
grant execute on function public.cancel_reward_redemption(bigint, text, text)
  to service_role;
