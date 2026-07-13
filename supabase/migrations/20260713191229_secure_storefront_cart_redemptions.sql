alter table public.reward_redemptions
  add column storefront_cart_id text,
  add column storefront_request_id uuid,
  add column shopify_order_id text;

create unique index reward_redemptions_storefront_request_unique_idx
  on public.reward_redemptions (customer_id, storefront_request_id)
  where storefront_request_id is not null;

create unique index reward_redemptions_active_storefront_cart_unique_idx
  on public.reward_redemptions (customer_id, storefront_cart_id)
  where storefront_cart_id is not null
    and status in (
      'requested',
      'creating',
      'approved',
      'cancelling',
      'reconciliation_required'
    );

create unique index reward_redemptions_shopify_order_unique_idx
  on public.reward_redemptions (shopify_order_id)
  where shopify_order_id is not null;

comment on column public.reward_redemptions.storefront_request_id is
  'Clave idempotente creada por el storefront. Un doble click o reintento devuelve el mismo canje sin volver a descontar puntos.';

comment on column public.reward_redemptions.storefront_cart_id is
  'Carrito Shopify Storefront al que quedó reservado y aplicado el canje.';

comment on column public.reward_redemptions.shopify_order_id is
  'Orden pagada que confirmó definitivamente el uso del canje.';

create or replace function public.redeem_storefront_cart_reward(
  p_customer_id bigint,
  p_reward_id bigint,
  p_storefront_cart_id text,
  p_request_id uuid,
  p_created_by text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  customer_record public.loyalty_customers%rowtype;
  reward_record public.rewards%rowtype;
  existing_record public.reward_redemptions%rowtype;
  points_transaction_id bigint;
  redemption_id bigint;
  effective_metadata jsonb;
begin
  if nullif(trim(p_storefront_cart_id), '') is null then
    raise exception 'A storefront redemption requires a Shopify cart';
  end if;

  if p_request_id is null then
    raise exception 'A storefront redemption requires an idempotency key';
  end if;

  if nullif(trim(p_created_by), '') is null then
    raise exception 'A redemption requires a responsible actor';
  end if;

  select *
    into existing_record
    from public.reward_redemptions
    where customer_id = p_customer_id
      and storefront_request_id = p_request_id
    for update;

  if found then
    if existing_record.reward_id <> p_reward_id
      or existing_record.storefront_cart_id <> trim(p_storefront_cart_id) then
      raise exception 'The idempotency key belongs to another redemption';
    end if;

    return jsonb_build_object(
      'redemption_id', existing_record.id,
      'transaction_id', existing_record.loyalty_transaction_id,
      'already_exists', true
    );
  end if;

  select *
    into existing_record
    from public.reward_redemptions
    where customer_id = p_customer_id
      and storefront_cart_id = trim(p_storefront_cart_id)
      and status in (
        'requested', 'creating', 'approved', 'cancelling',
        'reconciliation_required'
      )
    for update;

  if found then
    if existing_record.reward_id <> p_reward_id then
      raise exception 'The cart already has another active reward redemption';
    end if;

    return jsonb_build_object(
      'redemption_id', existing_record.id,
      'transaction_id', existing_record.loyalty_transaction_id,
      'already_exists', true
    );
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

  effective_metadata := coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
    'channel', 'online_storefront_cart',
    'shopify_cart_id', trim(p_storefront_cart_id),
    'storefront_request_id', p_request_id
  );

  begin
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
      'storefront_reward:' || p_request_id::text,
      'Reserva para canje de ' || reward_record.name,
      trim(p_created_by),
      effective_metadata
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
      expires_at,
      storefront_cart_id,
      storefront_request_id
    )
    values (
      p_customer_id,
      p_reward_id,
      points_transaction_id,
      reward_record.points_cost,
      'requested',
      null,
      effective_metadata,
      null,
      trim(p_storefront_cart_id),
      p_request_id
    )
    returning id into redemption_id;
  exception when unique_violation then
    select *
      into existing_record
      from public.reward_redemptions
      where customer_id = p_customer_id
        and (
          storefront_request_id = p_request_id
          or (
            storefront_cart_id = trim(p_storefront_cart_id)
            and status in (
              'requested', 'creating', 'approved', 'cancelling',
              'reconciliation_required'
            )
          )
        )
      order by (storefront_request_id = p_request_id) desc
      limit 1;

    if not found or existing_record.reward_id <> p_reward_id then
      raise;
    end if;

    return jsonb_build_object(
      'redemption_id', existing_record.id,
      'transaction_id', existing_record.loyalty_transaction_id,
      'already_exists', true
    );
  end;

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
    'storefront_cart_reserved',
    trim(p_created_by),
    jsonb_build_object(
      'customer_id', p_customer_id,
      'reward_id', p_reward_id,
      'points_reserved', reward_record.points_cost,
      'shopify_cart_id', trim(p_storefront_cart_id),
      'request_id', p_request_id
    )
  );

  return jsonb_build_object(
    'redemption_id', redemption_id,
    'transaction_id', points_transaction_id,
    'already_exists', false
  );
end;
$$;

create or replace function public.confirm_storefront_reward_order(
  p_redemption_id bigint,
  p_shopify_order_id text,
  p_created_by text
)
returns public.reward_redemptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_record public.reward_redemptions%rowtype;
  updated_record public.reward_redemptions%rowtype;
begin
  if nullif(trim(p_shopify_order_id), '') is null then
    raise exception 'Shopify order ID is required';
  end if;

  select * into current_record
    from public.reward_redemptions
    where id = p_redemption_id
    for update;

  if not found then
    raise exception 'Reward redemption % does not exist', p_redemption_id;
  end if;

  if current_record.status = 'fulfilled'
    and current_record.shopify_order_id = trim(p_shopify_order_id) then
    return current_record;
  end if;

  if current_record.status not in ('approved', 'cancelling') then
    raise exception 'Reward redemption % cannot be confirmed from status %',
      p_redemption_id, current_record.status;
  end if;

  update public.reward_redemptions
    set status = 'fulfilled',
        fulfilled_at = coalesce(fulfilled_at, now()),
        shopify_discount_status = 'used',
        shopify_discount_usage_count = greatest(shopify_discount_usage_count, 1),
        shopify_order_id = trim(p_shopify_order_id),
        shopify_discount_last_error = null
    where id = p_redemption_id
    returning * into updated_record;

  insert into public.audit_log (
    entity_type, entity_id, action, actor, old_data, new_data
  ) values (
    'reward_redemption', p_redemption_id::text,
    'confirmed_by_shopify_order_paid', trim(p_created_by),
    to_jsonb(current_record), to_jsonb(updated_record)
  );

  return updated_record;
end;
$$;

revoke all on function public.redeem_storefront_cart_reward(
  bigint, bigint, text, uuid, text, jsonb
) from public, anon, authenticated;
grant execute on function public.redeem_storefront_cart_reward(
  bigint, bigint, text, uuid, text, jsonb
) to service_role;

revoke all on function public.confirm_storefront_reward_order(
  bigint, text, text
) from public, anon, authenticated;
grant execute on function public.confirm_storefront_reward_order(
  bigint, text, text
) to service_role;
