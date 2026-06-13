alter table public.loyalty_customers
  add column auth_user_id uuid
    references auth.users(id) on delete set null;

update public.loyalty_customers as customer
set auth_user_id = auth_user.id
from auth.users as auth_user
where customer.auth_user_id is null
  and lower(customer.email) = lower(auth_user.email);

create unique index loyalty_customers_auth_user_id_unique_idx
  on public.loyalty_customers (auth_user_id)
  where auth_user_id is not null;

create unique index reward_redemptions_customer_request_unique_idx
  on public.reward_redemptions ((metadata ->> 'customer_request_id'))
  where nullif(metadata ->> 'customer_request_id', '') is not null;

grant select (
  id,
  auth_user_id,
  email,
  full_name,
  phone,
  status,
  points_balance,
  lifetime_points_earned,
  lifetime_points_redeemed,
  created_at
) on public.loyalty_customers to authenticated;

grant select (
  id,
  customer_id,
  transaction_type,
  points,
  balance_after,
  source,
  description,
  created_at
) on public.loyalty_transactions to authenticated;

grant select (
  id,
  customer_id,
  receipt_number,
  currency,
  subtotal,
  discount,
  total,
  points_earned,
  points_spent,
  shopify_order_name,
  benefit_type,
  benefit_amount,
  sold_at
) on public.physical_sales to authenticated;

grant select (
  id,
  name,
  description,
  reward_type,
  points_cost,
  shopify_product_id,
  is_active,
  created_at,
  updated_at,
  discount_amount_clp,
  minimum_purchase_clp,
  validity_days
) on public.rewards to authenticated;

grant select (
  id,
  customer_id,
  reward_id,
  loyalty_transaction_id,
  points_spent,
  status,
  redemption_code,
  redeemed_at,
  fulfilled_at,
  created_at,
  updated_at,
  expires_at,
  cancelled_at,
  cancellation_reason
) on public.reward_redemptions to authenticated;

grant select (
  id,
  name,
  spending_unit_clp,
  points_per_unit,
  point_redemption_value_clp,
  points_expiry_months,
  redemption_expiry_days,
  is_active,
  created_at,
  updated_at
) on public.loyalty_rules to authenticated;

drop policy if exists "customer reads own loyalty account"
  on public.loyalty_customers;
create policy "customer reads own loyalty account"
  on public.loyalty_customers
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id);

drop policy if exists "customer reads own loyalty transactions"
  on public.loyalty_transactions;
create policy "customer reads own loyalty transactions"
  on public.loyalty_transactions
  for select
  to authenticated
  using (
    customer_id in (
      select customer.id
      from public.loyalty_customers as customer
      where customer.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "customer reads own physical sales"
  on public.physical_sales;
create policy "customer reads own physical sales"
  on public.physical_sales
  for select
  to authenticated
  using (
    customer_id in (
      select customer.id
      from public.loyalty_customers as customer
      where customer.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "customer reads active rewards"
  on public.rewards;
create policy "customer reads active rewards"
  on public.rewards
  for select
  to authenticated
  using (is_active);

drop policy if exists "customer reads own reward redemptions"
  on public.reward_redemptions;
create policy "customer reads own reward redemptions"
  on public.reward_redemptions
  for select
  to authenticated
  using (
    customer_id in (
      select customer.id
      from public.loyalty_customers as customer
      where customer.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "customer reads active loyalty rule"
  on public.loyalty_rules;
create policy "customer reads active loyalty rule"
  on public.loyalty_rules
  for select
  to authenticated
  using (is_active);
