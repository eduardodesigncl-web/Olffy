# Backend Connections TODO

Status: All items are MOCK — replace before production.

## Shopify Storefront API

- [ ] `addToCart(productId, variantId, quantity)` → `cartLinesAdd` mutation
- [ ] `removeFromCart(lineId)` → `cartLinesRemove` mutation
- [ ] `updateCartLine(lineId, quantity)` → `cartLinesUpdate` mutation
- [ ] `getCart()` → `cart(id:)` query
- [ ] `createCheckout(form, cartId)` → `checkoutCreate` mutation
- [ ] Product listing in `ShopPage` → `products(first: 50)` query with filters
- [ ] Product detail in `ProductModal` → `product(handle:)` query
- [ ] Carousel products in `ProductsCarousel` → `products(first: 10, sortKey: CREATED_AT)` query

## Shopify Admin API (server-side only)

- [ ] `AdminProductsPage` sync button → `GET /admin/api/2024-01/products.json`
- [ ] Inventory updates → `PUT /admin/api/2024-01/variants/{id}.json`

## Supabase Auth

- [ ] `loginCustomer(email, password)` → `supabase.auth.signInWithPassword`
- [ ] `registerCustomer(name, email, password)` → `supabase.auth.signUp` + insert into `customers` table
- [ ] `logoutCustomer()` → `supabase.auth.signOut`
- [ ] Session management → `supabase.auth.getSession()` in layout

## Supabase Database

- [ ] `getCustomerProfile(customerId)` → `SELECT * FROM customers WHERE id = $1`
- [ ] `getCustomers()` (admin) → `SELECT * FROM customers ORDER BY points DESC`
- [ ] `adjustPoints(customerId, amount, reason)` → `UPDATE customers SET points = points + $2`
- [ ] `getRewards()` → `SELECT * FROM rewards WHERE active = true`
- [ ] `redeemReward(customerId, rewardId)` → `INSERT INTO redemptions ...`
- [ ] `approveRedemption(id)` → `UPDATE redemptions SET status = 'approved'`
- [ ] `rejectRedemption(id)` → `UPDATE redemptions SET status = 'rejected'`
- [ ] `getCustomerRedemptions(customerId)` → `SELECT * FROM redemptions WHERE customer_id = $1`
- [ ] `registerPhysicalSale(...)` → `INSERT INTO physical_sales`, then compute + issue points

## DTE / Boleta Electrónica (Chile SII)

- [ ] `createCheckout` should also trigger boleta issuance via DTE provider
- [ ] Recommended providers: Bsale, TributOS, or direct SII Web Service
- [ ] Requires RUT del emisor and digital certificate

## Klaviyo Marketing Events

- [ ] On `registerCustomer` → POST to Klaviyo `profiles` + add to list
- [ ] On checkout success → POST `Placed Order` event
- [ ] On `redeemReward` → POST `Reward Redeemed` event

## TUU / POS Integration

- [ ] `registerPhysicalSale` currently is manual entry — consider webhook from TUU to auto-register
- [ ] TUU webhook → Supabase Edge Function → insert physical_sale + issue points

## Priority order for connection

1. Supabase Auth (Login/Register)
2. Shopify Storefront API (products, cart, checkout)
3. Supabase DB (customers, points, rewards, redemptions)
4. Shopify Admin API (product sync in admin panel)
5. DTE boleta on checkout
6. Klaviyo events
7. TUU webhook
