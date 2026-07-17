-- Carrito mixto (propuesta OLFFY Puntos v2): la venta fisica puede incluir
-- productos excluidos del programa ("Sin puntos"). El pipeline informa el
-- monto elegible y los puntos se validan contra ese monto, no contra el total.
-- Se recrea finalize_physical_sale_pos agregando p_eligible_total (opcional,
-- compatible con llamadas existentes).

drop function if exists public.finalize_physical_sale_pos(
  uuid, uuid, bigint, text, text, text, text, numeric, numeric, numeric,
  text, bigint, bigint, text, text, jsonb, text, text, jsonb
);

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
  p_metadata jsonb default '{}'::jsonb,
  p_eligible_total numeric default null
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
  eligible_base numeric;
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

    -- Carrito mixto: los puntos se calculan solo sobre el monto elegible
    -- pagado (productos sin la categoria de exclusion). Si no se informa,
    -- se asume que toda la venta es elegible.
    eligible_base := coalesce(p_eligible_total, p_total);

    if eligible_base < 0 or eligible_base > p_total then
      raise exception 'Eligible total must be between zero and the sale total';
    end if;

    expected_points_earned :=
      floor(eligible_base / rule_record.spending_unit_clp)
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
    p_metadata || jsonb_build_object('eligible_total', coalesce(p_eligible_total, p_total))
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
