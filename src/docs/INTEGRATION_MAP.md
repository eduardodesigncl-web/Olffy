# OLFFY — Integration Map

## Services

| Service                | Role                                  | Environment Variable                               |
| ---------------------- | ------------------------------------- | -------------------------------------------------- |
| Shopify Storefront API | Product catalog, cart, checkout       | `SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_STORE_DOMAIN` |
| Shopify Admin API      | Admin product/inventory management    | `SHOPIFY_ADMIN_TOKEN`                              |
| Supabase               | Customers, points, redemptions, auth  | `SUPABASE_URL`, `SUPABASE_ANON_KEY`                |
| TUU / POS              | Physical store sales                  | Manual entry via `AdminSalesPage`                  |
| DTE / SII              | Chilean electronic invoicing (boleta) | `DTE_API_KEY` (third-party provider)               |
| Klaviyo                | Marketing events (signup, purchase)   | `KLAVIYO_API_KEY`                                  |

## `data-bind` attributes → Backend connections

| Attribute value            | Component                                       | Service                | Notes                                         |
| -------------------------- | ----------------------------------------------- | ---------------------- | --------------------------------------------- |
| `shopify-cart`             | `CartDrawer`                                    | Shopify Storefront API | `cartCreate`, `cartLinesAdd/Remove/Update`    |
| `shopify-products`         | `ProductsCarousel`, `FavoritesGrid`, `ShopPage` | Shopify Storefront API | `products` query with filters                 |
| `shopify-product-detail`   | `ProductModal`                                  | Shopify Storefront API | `product(handle:)` query                      |
| `shopify-checkout`         | `CheckoutPage`                                  | Shopify Storefront API | `checkoutCreate` mutation                     |
| `shopify-admin-products`   | `AdminProductsPage`                             | Shopify Admin API      | REST `GET /products.json`                     |
| `supabase-email`           | `LoginPage`, `RegisterPage`                     | Supabase Auth          | `supabase.auth.signIn/signUp`                 |
| `supabase-password`        | `LoginPage`, `RegisterPage`                     | Supabase Auth          | `supabase.auth.signIn/signUp`                 |
| `supabase-orders`          | `HistoryPage`                                   | Supabase DB            | `orders` table joined with `shopify_order_id` |
| `supabase-rewards`         | `RewardsPage`                                   | Supabase DB            | `rewards` table                               |
| `supabase-redemptions`     | `RedemptionsPage`                               | Supabase DB            | `redemptions` table                           |
| `supabase-customers`       | `AdminCustomerPage`                             | Supabase DB            | `customers` table with `points` balance       |
| `supabase-customer-lookup` | `AdminSalesPage`                                | Supabase DB            | Lookup by email to attach points              |

## `data-action` attributes → Action stubs

| Attribute value          | Component                                      | Action                                          | Service                |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------- | ---------------------- |
| `open-cart`              | `Navbar`                                       | Open CartDrawer                                 | Local state            |
| `add-to-cart`            | `ProductCard`, `ProductModal`, `FavoritesGrid` | `cartLinesAdd`                                  | Shopify Storefront API |
| `go-checkout`            | `CartDrawer`, `CartSummary`                    | Navigate to `/checkout`                         | Router                 |
| `confirm-checkout`       | `CheckoutPage`                                 | `checkoutCreate` + DTE boleta                   | Shopify + DTE          |
| `login`                  | `LoginPage`                                    | `supabase.auth.signInWithPassword`              | Supabase Auth          |
| `register`               | `RegisterPage`                                 | `supabase.auth.signUp`                          | Supabase Auth          |
| `redeem-reward`          | `RewardCard`                                   | Insert row in `redemptions`                     | Supabase DB            |
| `adjust-points`          | `AdminCustomerPage`                            | Update `customers.points`                       | Supabase DB            |
| `register-physical-sale` | `AdminSalesPage`                               | Insert `physical_sales`, compute + issue points | Supabase DB            |
| `sync-shopify-products`  | `AdminProductsPage`                            | Fetch from Shopify Admin API, upsert local      | Shopify Admin API      |
| `approve-redemption`     | `AdminRewardsPage`                             | Update `redemptions.status = approved`          | Supabase DB            |
| `reject-redemption`      | `AdminRewardsPage`                             | Update `redemptions.status = rejected`          | Supabase DB            |
| `manage-redemptions`     | `AdminPointsPage`                              | Navigate to canjes section                      | Local state            |
