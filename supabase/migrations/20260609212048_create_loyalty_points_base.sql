create table public.loyalty_customers (
  id bigint generated always as identity primary key,
  shopify_customer_id text unique,
  email text not null,
  full_name text,
  phone text,
  status text not null default 'active'
    check (status in ('active', 'blocked')),
  points_balance bigint not null default 0
    check (points_balance >= 0),
  lifetime_points_earned bigint not null default 0
    check (lifetime_points_earned >= 0),
  lifetime_points_redeemed bigint not null default 0
    check (lifetime_points_redeemed >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index loyalty_customers_email_unique_idx
  on public.loyalty_customers (lower(email));
create index loyalty_customers_phone_idx
  on public.loyalty_customers (phone)
  where phone is not null;
create index loyalty_customers_created_at_idx
  on public.loyalty_customers (created_at desc);

create table public.physical_sales (
  id bigint generated always as identity primary key,
  customer_id bigint not null
    references public.loyalty_customers(id) on delete restrict,
  tuu_transaction_id text not null unique,
  receipt_number text,
  payment_method text not null default 'tuu'
    check (payment_method = 'tuu'),
  currency text not null default 'CLP'
    check (currency = 'CLP'),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  total numeric(12, 2) not null check (total >= 0),
  points_earned bigint not null default 0 check (points_earned >= 0),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  sold_at timestamptz not null default now(),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint physical_sales_discount_valid check (discount <= subtotal),
  constraint physical_sales_total_valid check (total = subtotal - discount)
);

create index physical_sales_customer_id_sold_at_idx
  on public.physical_sales (customer_id, sold_at desc);
create index physical_sales_sold_at_idx
  on public.physical_sales (sold_at desc);

create table public.physical_sale_items (
  id bigint generated always as identity primary key,
  physical_sale_id bigint not null
    references public.physical_sales(id) on delete cascade,
  shopify_product_id text not null,
  shopify_variant_id text,
  sku text,
  product_title text not null,
  variant_title text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2)
    generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

comment on table public.physical_sale_items is
  'Snapshots de productos vendidos fisicamente. Shopify sigue siendo la fuente de inventario.';

create index physical_sale_items_sale_id_idx
  on public.physical_sale_items (physical_sale_id);
create index physical_sale_items_shopify_variant_id_idx
  on public.physical_sale_items (shopify_variant_id)
  where shopify_variant_id is not null;

create table public.loyalty_transactions (
  id bigint generated always as identity primary key,
  customer_id bigint not null
    references public.loyalty_customers(id) on delete restrict,
  transaction_type text not null
    check (transaction_type in ('earned', 'redeemed', 'adjusted', 'expired', 'reversed')),
  points bigint not null check (points <> 0),
  balance_after bigint not null default 0 check (balance_after >= 0),
  source text not null
    check (source in ('physical_sale', 'shopify_order', 'reward_redemption', 'manual', 'system')),
  external_reference text,
  physical_sale_id bigint
    references public.physical_sales(id) on delete restrict,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  constraint loyalty_transactions_points_sign check (
    (transaction_type = 'earned' and points > 0)
    or (transaction_type in ('redeemed', 'expired') and points < 0)
    or (transaction_type in ('adjusted', 'reversed'))
  ),
  constraint loyalty_transactions_physical_sale_source check (
    source <> 'physical_sale' or physical_sale_id is not null
  )
);

create unique index loyalty_transactions_source_reference_unique_idx
  on public.loyalty_transactions (source, external_reference)
  where external_reference is not null;
create unique index loyalty_transactions_physical_sale_unique_idx
  on public.loyalty_transactions (physical_sale_id)
  where physical_sale_id is not null;
create index loyalty_transactions_customer_created_at_idx
  on public.loyalty_transactions (customer_id, created_at desc);
create index loyalty_transactions_created_at_idx
  on public.loyalty_transactions (created_at desc);

create table public.rewards (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  reward_type text not null
    check (reward_type in ('discount', 'product', 'experience', 'other')),
  points_cost bigint not null check (points_cost > 0),
  shopify_product_id text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rewards_active_points_cost_idx
  on public.rewards (points_cost)
  where is_active;

create table public.reward_redemptions (
  id bigint generated always as identity primary key,
  customer_id bigint not null
    references public.loyalty_customers(id) on delete restrict,
  reward_id bigint not null
    references public.rewards(id) on delete restrict,
  loyalty_transaction_id bigint unique
    references public.loyalty_transactions(id) on delete restrict,
  points_spent bigint not null check (points_spent > 0),
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'fulfilled', 'cancelled')),
  redemption_code text unique,
  metadata jsonb not null default '{}'::jsonb,
  redeemed_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reward_redemptions_customer_redeemed_at_idx
  on public.reward_redemptions (customer_id, redeemed_at desc);
create index reward_redemptions_reward_id_idx
  on public.reward_redemptions (reward_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx
  on public.audit_log (entity_type, entity_id, created_at desc);
create index audit_log_created_at_idx
  on public.audit_log (created_at desc);

create table public.email_events (
  id bigint generated always as identity primary key,
  customer_id bigint
    references public.loyalty_customers(id) on delete set null,
  event_type text not null,
  status text not null default 'recorded'
    check (status in ('recorded', 'queued', 'processed', 'failed', 'cancelled')),
  recipient_email text,
  provider text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.email_events is
  'Eventos para automatizaciones futuras. Esta base no envia emails.';

create index email_events_status_occurred_at_idx
  on public.email_events (status, occurred_at);
create index email_events_customer_id_idx
  on public.email_events (customer_id, occurred_at desc)
  where customer_id is not null;

create or replace function public.loyalty_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger loyalty_customers_set_updated_at
before update on public.loyalty_customers
for each row execute function public.loyalty_set_updated_at();

create trigger physical_sales_set_updated_at
before update on public.physical_sales
for each row execute function public.loyalty_set_updated_at();

create trigger rewards_set_updated_at
before update on public.rewards
for each row execute function public.loyalty_set_updated_at();

create trigger reward_redemptions_set_updated_at
before update on public.reward_redemptions
for each row execute function public.loyalty_set_updated_at();

create or replace function public.loyalty_apply_transaction()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_balance bigint;
  next_balance bigint;
begin
  select points_balance
    into current_balance
    from public.loyalty_customers
    where id = new.customer_id
    for update;

  if not found then
    raise exception 'Loyalty customer % does not exist', new.customer_id;
  end if;

  next_balance := current_balance + new.points;

  if next_balance < 0 then
    raise exception 'Insufficient points for customer %', new.customer_id;
  end if;

  update public.loyalty_customers
    set points_balance = next_balance,
        lifetime_points_earned = lifetime_points_earned
          + case when new.transaction_type = 'earned' then new.points else 0 end,
        lifetime_points_redeemed = lifetime_points_redeemed
          + case when new.transaction_type = 'redeemed' then abs(new.points) else 0 end
    where id = new.customer_id;

  new.balance_after := next_balance;
  return new;
end;
$$;

create trigger loyalty_transactions_apply_balance
before insert on public.loyalty_transactions
for each row execute function public.loyalty_apply_transaction();

create or replace function public.loyalty_record_customer_email_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.email_events (
    customer_id,
    event_type,
    recipient_email,
    payload
  )
  values (
    new.id,
    'loyalty_customer_created',
    new.email,
    jsonb_build_object('customer_id', new.id)
  );

  return new;
end;
$$;

create trigger loyalty_customers_record_email_event
after insert on public.loyalty_customers
for each row execute function public.loyalty_record_customer_email_event();

create or replace function public.loyalty_record_transaction_email_event()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  customer_email text;
begin
  select email
    into customer_email
    from public.loyalty_customers
    where id = new.customer_id;

  insert into public.email_events (
    customer_id,
    event_type,
    recipient_email,
    payload
  )
  values (
    new.customer_id,
    'loyalty_points_' || new.transaction_type,
    customer_email,
    jsonb_build_object(
      'transaction_id', new.id,
      'points', new.points,
      'balance_after', new.balance_after,
      'source', new.source
    )
  );

  return new;
end;
$$;

create trigger loyalty_transactions_record_email_event
after insert on public.loyalty_transactions
for each row execute function public.loyalty_record_transaction_email_event();

create or replace function public.get_loyalty_stats()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'customers_count', (select count(*) from public.loyalty_customers),
    'active_customers_count', (
      select count(*) from public.loyalty_customers where status = 'active'
    ),
    'outstanding_points', (
      select coalesce(sum(points_balance), 0) from public.loyalty_customers
    ),
    'lifetime_points_earned', (
      select coalesce(sum(lifetime_points_earned), 0) from public.loyalty_customers
    ),
    'lifetime_points_redeemed', (
      select coalesce(sum(lifetime_points_redeemed), 0) from public.loyalty_customers
    ),
    'physical_sales_count', (select count(*) from public.physical_sales),
    'physical_sales_total', (
      select coalesce(sum(total), 0) from public.physical_sales
    ),
    'active_rewards_count', (
      select count(*) from public.rewards where is_active
    ),
    'redemptions_count', (
      select count(*) from public.reward_redemptions where status <> 'cancelled'
    )
  );
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
    p_tuu_transaction_id,
    p_receipt_number,
    p_subtotal,
    p_discount,
    p_total,
    p_points_earned,
    p_notes,
    p_sold_at,
    p_created_by,
    p_metadata
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
    nullif(item ->> 'shopify_variant_id', ''),
    nullif(item ->> 'sku', ''),
    item ->> 'product_title',
    nullif(item ->> 'variant_title', ''),
    (item ->> 'quantity')::integer,
    (item ->> 'unit_price')::numeric
  from jsonb_array_elements(p_items) as item;

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
      p_tuu_transaction_id,
      sale_id,
      'Puntos por venta fisica TUU',
      p_created_by
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
      'tuu_transaction_id', p_tuu_transaction_id,
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
    p_created_by,
    jsonb_build_object(
      'customer_id', p_customer_id,
      'tuu_transaction_id', p_tuu_transaction_id,
      'total', p_total,
      'points_earned', p_points_earned
    )
  );

  return sale_id;
end;
$$;

alter table public.loyalty_customers enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.physical_sales enable row level security;
alter table public.physical_sale_items enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.audit_log enable row level security;
alter table public.email_events enable row level security;

revoke all on table
  public.loyalty_customers,
  public.loyalty_transactions,
  public.physical_sales,
  public.physical_sale_items,
  public.rewards,
  public.reward_redemptions,
  public.audit_log,
  public.email_events
from anon, authenticated;

grant select, insert, update, delete on table
  public.loyalty_customers,
  public.loyalty_transactions,
  public.physical_sales,
  public.physical_sale_items,
  public.rewards,
  public.reward_redemptions,
  public.audit_log,
  public.email_events
to service_role;

grant usage, select on sequence
  public.loyalty_customers_id_seq,
  public.physical_sales_id_seq,
  public.physical_sale_items_id_seq,
  public.loyalty_transactions_id_seq,
  public.rewards_id_seq,
  public.reward_redemptions_id_seq,
  public.audit_log_id_seq,
  public.email_events_id_seq
to service_role;

revoke all on function public.loyalty_set_updated_at() from public, anon, authenticated;
revoke all on function public.loyalty_apply_transaction() from public, anon, authenticated;
revoke all on function public.loyalty_record_customer_email_event() from public, anon, authenticated;
revoke all on function public.loyalty_record_transaction_email_event() from public, anon, authenticated;
revoke all on function public.get_loyalty_stats() from public, anon, authenticated;
revoke all on function public.register_physical_sale(
  bigint, text, text, numeric, numeric, numeric, jsonb, bigint, text, text, timestamptz, jsonb
) from public, anon, authenticated;

grant execute on function public.loyalty_set_updated_at() to service_role;
grant execute on function public.loyalty_apply_transaction() to service_role;
grant execute on function public.loyalty_record_customer_email_event() to service_role;
grant execute on function public.loyalty_record_transaction_email_event() to service_role;
grant execute on function public.get_loyalty_stats() to service_role;
grant execute on function public.register_physical_sale(
  bigint, text, text, numeric, numeric, numeric, jsonb, bigint, text, text, timestamptz, jsonb
) to service_role;
