alter table public.olffy_order_refs
  add column if not exists idempotency_key text,
  add column if not exists points_earned integer not null default 0
    check (points_earned >= 0);

create unique index if not exists olffy_order_refs_idempotency_key_unique_idx
  on public.olffy_order_refs (idempotency_key)
  where idempotency_key is not null;

create index if not exists olffy_order_refs_channel_created_at_idx
  on public.olffy_order_refs (channel, created_at desc);

create index if not exists olffy_order_refs_channel_payment_status_idx
  on public.olffy_order_refs (channel, payment_status, created_at desc);

create index if not exists olffy_order_refs_payment_status_idx
  on public.olffy_order_refs (payment_status);

create index if not exists olffy_order_refs_customer_email_idx
  on public.olffy_order_refs (customer_email)
  where customer_email is not null;

create index if not exists olffy_order_refs_shopify_order_id_idx
  on public.olffy_order_refs (shopify_order_id)
  where shopify_order_id is not null;

create or replace function public.get_olffy_digital_sales_summary()
returns jsonb
language sql
stable
set search_path = ''
as $$
  with boundaries as (
    select (
      date_trunc('day', timezone('America/Santiago', now()))
      at time zone 'America/Santiago'
    ) as today_start
  ),
  online as (
    select refs.*
    from public.olffy_order_refs as refs
    where refs.channel = 'online'
  )
  select jsonb_build_object(
    'sales_today', count(*) filter (
      where online.payment_status = 'confirmed'
        and online.created_at >= boundaries.today_start
    ),
    'total_sold', coalesce(sum(online.total) filter (
      where online.payment_status = 'confirmed'
    ), 0),
    'paid_orders', count(*) filter (
      where online.payment_status = 'confirmed'
    ),
    'mercado_pago_orders', count(*) filter (
      where online.payment_status = 'confirmed'
        and online.payment_provider = 'mercado_pago'
    ),
    'checkout_flow_orders', count(*) filter (
      where online.payment_status = 'confirmed'
        and online.payment_provider = 'checkout_flow'
    ),
    'identified_customers', count(*) filter (
      where online.payment_status = 'confirmed'
        and online.loyalty_customer_id is not null
    ),
    'points_generated', coalesce(sum(online.points_earned) filter (
      where online.payment_status = 'confirmed'
    ), 0),
    'pending_errors', count(*) filter (
      where online.last_error is not null
        or online.payment_status in ('rejected', 'manual_review')
        or online.tax_status in ('rejected', 'manual_review')
        or online.loyalty_status = 'failed'
        or online.marketing_status = 'failed'
    )
  )
  from online
  cross join boundaries;
$$;

revoke all on function public.get_olffy_digital_sales_summary()
  from public, anon, authenticated;

grant execute on function public.get_olffy_digital_sales_summary()
  to service_role;
