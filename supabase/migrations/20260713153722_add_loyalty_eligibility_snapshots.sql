-- OLFFY Puntos v2: snapshot histórico por venta y por línea.
-- La fuente de elegibilidad es Shopify product metafield
-- olffy.exclude_from_points (boolean); la colección es solo visual.

alter table public.olffy_order_refs
  add column eligible_total integer,
  add column excluded_total integer,
  add column rule_id bigint references public.loyalty_rules(id) on delete restrict,
  add column spending_unit_clp integer,
  add column points_per_unit bigint,
  add column calculation_version text,
  add column loyalty_snapshot jsonb;

alter table public.olffy_order_refs
  add constraint olffy_order_refs_eligible_total_check
    check (eligible_total is null or eligible_total >= 0),
  add constraint olffy_order_refs_excluded_total_check
    check (excluded_total is null or excluded_total >= 0),
  add constraint olffy_order_refs_rule_values_check
    check (
      (spending_unit_clp is null and points_per_unit is null)
      or (spending_unit_clp > 0 and points_per_unit > 0)
    ),
  add constraint olffy_order_refs_snapshot_shape_check
    check (loyalty_snapshot is null or jsonb_typeof(loyalty_snapshot) = 'object');

create index olffy_order_refs_rule_idx
  on public.olffy_order_refs (rule_id, created_at desc)
  where rule_id is not null;

alter table public.physical_sales
  add column eligible_total numeric(12, 2),
  add column excluded_total numeric(12, 2),
  add column rule_id bigint references public.loyalty_rules(id) on delete restrict,
  add column spending_unit_clp integer,
  add column points_per_unit bigint,
  add column calculation_version text,
  add column loyalty_snapshot jsonb;

alter table public.physical_sales
  add constraint physical_sales_eligible_total_check
    check (eligible_total is null or eligible_total >= 0),
  add constraint physical_sales_excluded_total_check
    check (excluded_total is null or excluded_total >= 0),
  add constraint physical_sales_snapshot_shape_check
    check (loyalty_snapshot is null or jsonb_typeof(loyalty_snapshot) = 'object');

alter table public.physical_sale_items
  add column gross_total numeric(12, 2),
  add column allocated_discount numeric(12, 2),
  add column paid_total numeric(12, 2),
  add column eligible boolean,
  add column eligible_amount numeric(12, 2),
  add column exclusion_reason text;

alter table public.physical_sale_items
  add constraint physical_sale_items_loyalty_amounts_check
    check (
      (gross_total is null or gross_total >= 0)
      and (allocated_discount is null or allocated_discount >= 0)
      and (paid_total is null or paid_total >= 0)
      and (eligible_amount is null or eligible_amount >= 0)
    );

comment on column public.olffy_order_refs.loyalty_snapshot is
  'Snapshot inmutable de líneas, elegibilidad, descuentos, regla y puntos usado al confirmar la venta.';
comment on column public.physical_sales.loyalty_snapshot is
  'Copia histórica del cálculo OLFFY Puntos; no se recalcula al cambiar metafields o reglas.';
comment on column public.physical_sale_items.eligible is
  'Elegibilidad resuelta desde olffy.exclude_from_points al confirmar la venta.';

-- Registra también devoluciones que no cruzan un umbral de puntos. Sin este
-- ledger, dos devoluciones parciales pequeñas podrían no acumularse entre sí.
create table public.loyalty_refund_events (
  id bigint generated always as identity primary key,
  shopify_order_id text not null,
  refund_id text not null,
  refunded_amount numeric(12, 2) not null default 0
    check (refunded_amount >= 0),
  eligible_refunded_amount numeric(12, 2) not null default 0
    check (eligible_refunded_amount >= 0),
  points_reversed bigint not null default 0
    check (points_reversed >= 0),
  reversal_transaction_id bigint
    references public.loyalty_transactions(id) on delete restrict,
  status text not null default 'processing'
    check (status in ('processing', 'processed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shopify_order_id, refund_id)
);

create index loyalty_refund_events_order_idx
  on public.loyalty_refund_events (shopify_order_id, created_at);

create trigger loyalty_refund_events_set_updated_at
before update on public.loyalty_refund_events
for each row execute function public.loyalty_set_updated_at();

alter table public.loyalty_refund_events enable row level security;
revoke all on table public.loyalty_refund_events from anon, authenticated;
grant all on table public.loyalty_refund_events to service_role;
grant usage, select on sequence public.loyalty_refund_events_id_seq to service_role;

comment on table public.loyalty_refund_events is
  'Ledger idempotente de devoluciones Shopify, incluyendo eventos sin reversa de puntos.';
