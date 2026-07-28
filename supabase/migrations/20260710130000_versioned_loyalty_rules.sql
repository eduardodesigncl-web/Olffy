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
