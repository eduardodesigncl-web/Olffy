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
