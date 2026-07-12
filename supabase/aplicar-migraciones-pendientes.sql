-- OLFFY: migraciones pendientes combinadas (ejecutar completo, en orden).
-- Generado para pegar en el SQL Editor de Supabase o correr via psql.
begin;

-- ============================================================
-- 20260710130000_versioned_loyalty_rules.sql
-- ============================================================

-- Sprint 5 · Plan maestro OLFFY
-- 1. Versionado de reglas de puntos (valid_from, autoría, notas).
-- 2. Regla vigente de producción: $200 CLP = 1 punto, expiración 6 meses.
-- 3. Mínimos de compra de las recompensas iniciales (300/500/1000 pts).
-- 4. Sello de la versión de regla aplicada en cada movimiento del ledger.
-- 5. RPC publish_loyalty_rule para publicar versiones desde el panel con
--    auditoría y sin edición retroactiva.

-- 1. Versionado ------------------------------------------------------------

alter table public.loyalty_rules
  add column valid_from timestamptz not null default now(),
  add column created_by text,
  add column notes text;

comment on column public.loyalty_rules.valid_from is
  'Inicio de vigencia. Las versiones nunca se editan: se publica una nueva fila y la anterior queda inactiva como historial.';

-- 2. Regla vigente $200 = 1 punto -------------------------------------------

update public.loyalty_rules
  set is_active = false
  where is_active;

insert into public.loyalty_rules (
  name,
  spending_unit_clp,
  points_per_unit,
  point_redemption_value_clp,
  points_expiry_months,
  redemption_expiry_days,
  is_active,
  valid_from,
  created_by,
  notes
)
values (
  'OLFFY Puntos · $200 = 1 punto',
  200,
  1,
  10,
  6,
  30,
  true,
  now(),
  'plan-maestro-julio-2026',
  'Versión inicial de producción. 1 punto por cada $200 CLP pagados en productos elegibles, después de descuentos y sin envío. Vigencia de puntos: 6 meses por lote.'
);

insert into public.audit_log (entity_type, entity_id, action, actor, new_data)
select
  'loyalty_rule',
  id::text,
  'rule_published',
  'plan-maestro-julio-2026',
  to_jsonb(loyalty_rules.*) - 'metadata'
from public.loyalty_rules
where is_active;

-- 3. Mínimos de compra de recompensas ---------------------------------------

update public.rewards
  set minimum_purchase_clp = 20000
  where reward_type = 'discount' and points_cost = 300;

update public.rewards
  set minimum_purchase_clp = 30000
  where reward_type = 'discount' and points_cost = 500;

update public.rewards
  set minimum_purchase_clp = 60000
  where reward_type = 'discount' and points_cost = 1000;

insert into public.audit_log (entity_type, entity_id, action, actor, new_data)
select
  'reward',
  id::text,
  'minimum_purchase_updated',
  'plan-maestro-julio-2026',
  jsonb_build_object(
    'points_cost', points_cost,
    'minimum_purchase_clp', minimum_purchase_clp
  )
from public.rewards
where reward_type = 'discount' and points_cost in (300, 500, 1000);

-- 4. Sello de versión de regla en el ledger ---------------------------------

alter table public.loyalty_transactions
  add column rule_id bigint references public.loyalty_rules(id) on delete restrict;

create index loyalty_transactions_rule_id_idx
  on public.loyalty_transactions (rule_id)
  where rule_id is not null;

create or replace function public.loyalty_stamp_rule_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  rule_record public.loyalty_rules%rowtype;
begin
  -- Solo movimientos derivados de la regla comercial llevan sello automático;
  -- ajustes manuales y reversas conservan la regla que traiga el llamador.
  if new.rule_id is null
    and new.transaction_type in ('earned', 'redeemed') then
    select * into rule_record
      from public.loyalty_rules
      where is_active
      limit 1;

    if found then
      new.rule_id := rule_record.id;
      new.metadata := coalesce(new.metadata, '{}'::jsonb)
        || jsonb_build_object(
          'rule_snapshot', jsonb_build_object(
            'rule_id', rule_record.id,
            'name', rule_record.name,
            'spending_unit_clp', rule_record.spending_unit_clp,
            'points_per_unit', rule_record.points_per_unit,
            'point_redemption_value_clp', rule_record.point_redemption_value_clp,
            'points_expiry_months', rule_record.points_expiry_months,
            'valid_from', rule_record.valid_from
          )
        );
    end if;
  end if;

  return new;
end;
$$;

create trigger loyalty_transactions_stamp_rule
before insert on public.loyalty_transactions
for each row execute function public.loyalty_stamp_rule_version();

-- 5. Publicación de versiones desde el panel ---------------------------------

create or replace function public.publish_loyalty_rule(
  p_name text,
  p_spending_unit_clp integer,
  p_points_per_unit bigint,
  p_point_redemption_value_clp integer,
  p_points_expiry_months integer,
  p_redemption_expiry_days integer,
  p_created_by text,
  p_notes text default null
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  old_rule public.loyalty_rules%rowtype;
  new_rule_id bigint;
begin
  if nullif(trim(p_name), '') is null then
    raise exception 'La regla requiere un nombre';
  end if;

  if nullif(trim(p_created_by), '') is null then
    raise exception 'Publicar una regla requiere un responsable';
  end if;

  if coalesce(p_spending_unit_clp, 0) <= 0
    or coalesce(p_points_per_unit, 0) <= 0
    or coalesce(p_point_redemption_value_clp, 0) <= 0
    or coalesce(p_points_expiry_months, 0) <= 0
    or coalesce(p_redemption_expiry_days, 0) <= 0 then
    raise exception 'Todos los valores de la regla deben ser mayores que cero';
  end if;

  select * into old_rule
    from public.loyalty_rules
    where is_active
    limit 1
    for update;

  update public.loyalty_rules
    set is_active = false
    where is_active;

  insert into public.loyalty_rules (
    name,
    spending_unit_clp,
    points_per_unit,
    point_redemption_value_clp,
    points_expiry_months,
    redemption_expiry_days,
    is_active,
    valid_from,
    created_by,
    notes
  )
  values (
    trim(p_name),
    p_spending_unit_clp,
    p_points_per_unit,
    p_point_redemption_value_clp,
    p_points_expiry_months,
    p_redemption_expiry_days,
    true,
    now(),
    trim(p_created_by),
    nullif(trim(p_notes), '')
  )
  returning id into new_rule_id;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    actor,
    old_data,
    new_data,
    metadata
  )
  values (
    'loyalty_rule',
    new_rule_id::text,
    'rule_published',
    trim(p_created_by),
    case when old_rule.id is null then null
      else to_jsonb(old_rule) - 'metadata' end,
    (select to_jsonb(r) - 'metadata'
       from public.loyalty_rules r
       where r.id = new_rule_id),
    jsonb_build_object('non_retroactive', true)
  );

  return new_rule_id;
end;
$$;

revoke all on function public.publish_loyalty_rule(
  text, integer, bigint, integer, integer, integer, text, text
) from public, anon, authenticated;


-- ============================================================
-- 20260711120000_eligible_total_physical_sale.sql
-- ============================================================

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


-- ============================================================
-- 20260711130000_loyalty_points_expiration.sql
-- ============================================================

-- Expiración de puntos por lote (propuesta OLFFY Puntos v2):
-- cada acumulación vence a los N meses de su generación (regla vigente: 6).
-- El consumo es FIFO (se descuentan primero los puntos más antiguos), por lo
-- que al vencer un lote solo expira su remanente no consumido.

-- 1. Fecha de vencimiento por lote --------------------------------------------

alter table public.loyalty_transactions
  add column expires_at timestamptz;

create index loyalty_transactions_expiry_idx
  on public.loyalty_transactions (expires_at)
  where expires_at is not null;

-- Backfill: lotes positivos existentes vencen según la regla que los generó
-- (o la vigente si no quedó sellada).
update public.loyalty_transactions t
set expires_at = t.created_at + make_interval(
  months => coalesce(
    (select points_expiry_months from public.loyalty_rules where id = t.rule_id),
    (select points_expiry_months from public.loyalty_rules where is_active limit 1),
    6
  )
)
where t.points > 0
  and t.transaction_type in ('earned', 'adjusted')
  and t.expires_at is null;

-- 2. El trigger de sellado también estampa el vencimiento del lote -------------

create or replace function public.loyalty_stamp_rule_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  rule_record public.loyalty_rules%rowtype;
begin
  select * into rule_record
    from public.loyalty_rules
    where is_active
    limit 1;

  -- Solo movimientos derivados de la regla comercial llevan sello automático;
  -- ajustes manuales y reversas conservan la regla que traiga el llamador.
  if found
    and new.rule_id is null
    and new.transaction_type in ('earned', 'redeemed') then
    new.rule_id := rule_record.id;
    new.metadata := coalesce(new.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'rule_snapshot', jsonb_build_object(
          'rule_id', rule_record.id,
          'name', rule_record.name,
          'spending_unit_clp', rule_record.spending_unit_clp,
          'points_per_unit', rule_record.points_per_unit,
          'point_redemption_value_clp', rule_record.point_redemption_value_clp,
          'points_expiry_months', rule_record.points_expiry_months,
          'valid_from', rule_record.valid_from
        )
      );
  end if;

  -- Todo lote positivo (earned o ajuste a favor) recibe fecha de vencimiento.
  if found
    and new.expires_at is null
    and new.points > 0
    and new.transaction_type in ('earned', 'adjusted') then
    new.expires_at := coalesce(new.created_at, now())
      + make_interval(months => rule_record.points_expiry_months);
  end if;

  return new;
end;
$$;

-- 3. Remanente por lote bajo consumo FIFO --------------------------------------

create or replace function public.loyalty_lot_remaining(p_customer_id bigint)
returns table (
  transaction_id bigint,
  lot_created_at timestamptz,
  lot_expires_at timestamptz,
  lot_points bigint,
  remaining bigint
)
language plpgsql
stable
set search_path = ''
as $$
declare
  consumed bigint;
begin
  select coalesce(sum(-points), 0)
    into consumed
    from public.loyalty_transactions
    where customer_id = p_customer_id and points < 0;

  return query
  with lots as (
    select
      id,
      created_at,
      expires_at,
      points,
      sum(points) over (order by created_at, id) as cumulative
    from public.loyalty_transactions
    where customer_id = p_customer_id and points > 0
  )
  select
    id,
    created_at,
    expires_at,
    points,
    greatest(least(cumulative - consumed, points), 0::bigint)
  from lots;
end;
$$;

-- 4. Expiración: inserta el movimiento 'expired' por el remanente vencido ------

create or replace function public.expire_loyalty_points()
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  candidate record;
  points_to_expire bigint;
  affected_customers integer := 0;
  total_expired bigint := 0;
begin
  -- Evita dobles ejecuciones concurrentes (cron + manual).
  perform pg_advisory_xact_lock(hashtext('olffy_expire_loyalty_points'));

  for candidate in
    select distinct customer_id
      from public.loyalty_transactions
      where points > 0
        and expires_at is not null
        and expires_at <= now()
  loop
    select coalesce(sum(remaining), 0)
      into points_to_expire
      from public.loyalty_lot_remaining(candidate.customer_id)
      where lot_expires_at is not null
        and lot_expires_at <= now()
        and remaining > 0;

    if points_to_expire > 0 then
      insert into public.loyalty_transactions (
        customer_id,
        transaction_type,
        points,
        source,
        description,
        created_by,
        metadata
      )
      values (
        candidate.customer_id,
        'expired',
        -points_to_expire,
        'system',
        'Puntos vencidos por lote (regla OLFFY Puntos)',
        'system:points_expiry',
        jsonb_build_object('expired_at', now())
      );

      insert into public.audit_log (entity_type, entity_id, action, actor, new_data)
      values (
        'loyalty_customer',
        candidate.customer_id::text,
        'points_expired',
        'system:points_expiry',
        jsonb_build_object('points_expired', points_to_expire)
      );

      affected_customers := affected_customers + 1;
      total_expired := total_expired + points_to_expire;
    end if;
  end loop;

  return jsonb_build_object(
    'customers', affected_customers,
    'points_expired', total_expired,
    'ran_at', now()
  );
end;
$$;

-- 5. Puntos próximos a vencer (dashboard/aviso al cliente) ----------------------

create or replace function public.get_expiring_loyalty_points(
  p_customer_id bigint,
  p_within_days integer default 30
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'expiring_points', coalesce(sum(remaining), 0),
    'next_expiry', min(lot_expires_at)
  )
  from public.loyalty_lot_remaining(p_customer_id)
  where remaining > 0
    and lot_expires_at is not null
    and lot_expires_at > now()
    and lot_expires_at <= now() + make_interval(days => p_within_days);
$$;

revoke all on function public.expire_loyalty_points() from public, anon, authenticated;
revoke all on function public.loyalty_lot_remaining(bigint) from public, anon, authenticated;
revoke all on function public.get_expiring_loyalty_points(bigint, integer) from public, anon, authenticated;


-- ============================================================
-- 20260711140000_guest_pending_claims.sql
-- ============================================================

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


-- Registrar las versiones en el control de migraciones del CLI (si existe),
-- para que un futuro `supabase db push` no intente re-aplicarlas.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'supabase_migrations' and table_name = 'schema_migrations'
  ) then
    insert into supabase_migrations.schema_migrations (version)
    values
      ('20260710130000'),
      ('20260711120000'),
      ('20260711130000'),
      ('20260711140000')
    on conflict do nothing;
  end if;
end $$;

commit;