-- Corrección: sum(bigint) en ventanas devuelve numeric, por lo que la columna
-- "remaining" de loyalty_lot_remaining no coincidía con su tipo declarado
-- (bigint) y las RPC de expiración/aviso fallaban con 42804.

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
    greatest(least(cumulative - consumed, points), 0)::bigint
  from lots;
end;
$$;

revoke all on function public.loyalty_lot_remaining(bigint) from public, anon, authenticated;

-- Registrar la versión en el control del CLI (si existe).
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'supabase_migrations' and table_name = 'schema_migrations'
  ) then
    insert into supabase_migrations.schema_migrations (version)
    values ('20260712120000')
    on conflict do nothing;
  end if;
end $$;
