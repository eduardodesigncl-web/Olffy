# OLFFY Frontend Handoff

## Design Tokens

### Colors

```typescript
const C = {
  cream: "#fff5d9",
  yellow: "#fab405",
  orange: "#e94300",
  purple: "#5957b0",
  textMain: "#343434",
  textSecondary: "#6a6a6a",
};
```

### Fonts

```typescript
const T = {
  piepie: "'PiepieW01-Regular', sans-serif", // Display, headings, brand
  ivy: "'IvyPresto Text', Georgia, serif", // Serif accent, italics
  poppins: "'Poppins', sans-serif", // Body, UI, labels
};
```

Font loading: see `olffy-tokens.css` for `@font-face` declarations.

### CSS Variables

All tokens are in `olffy-tokens.css` as CSS custom properties on `:root`. Components use inline `style={{ fontFamily: T.xxx }}` patterns for Tailwind compatibility.

## Component Inventory

| Category | Components                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout   | `Navbar`, `PromoBanner`, `Footer`, `CartDrawer`, `AppShell`                                                                                       |
| Shared   | `ImgBox`, `SectionHeading`, `StatCard`, `OlffyLogo`                                                                                               |
| Home     | `HeroSection`, `NewLaunchesSection`, `ProductsCarousel`, `KnowOlffySection`, `FilmStrip`, `FavoritesGrid`                                         |
| Shop     | `ShopPage`, `ProductCard`                                                                                                                         |
| Product  | `ProductModal`                                                                                                                                    |
| Cart     | `CartLine`, `CartSummary`                                                                                                                         |
| Checkout | `CheckoutPage`                                                                                                                                    |
| Customer | `LoginPage`, `RegisterPage`, `AccountDashboard`, `AccountSidebar`, `HistoryPage`, `RewardsPage`, `RedemptionsPage`                                |
| Loyalty  | `PointsHero`, `PointsStats`, `RewardCard`, `RedemptionCard`                                                                                       |
| Admin    | `AdminShell`, `AdminSidebar`, `AdminDashboard`, `AdminCustomerPage`, `AdminProductsPage`, `AdminPointsPage`, `AdminSalesPage`, `AdminRewardsPage` |

## Key Design Decisions

1. All components use inline `style={}` for brand fonts and colors — Tailwind does not support custom fonts at runtime without config
2. `data-action` and `data-bind` HTML attributes mark all integration points — search for them with `grep -r "data-action\|data-bind"` to find every hook
3. `ImgBox` is a placeholder for all images — replace with `next/image` pointing to Shopify CDN URLs
4. `OlffyLogo` is a text placeholder — replace SVG paths from Figma export
5. Admin login posts to `/api/admin/auth`; configure `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` server-side before production

## Image Strategy

- Product images: Shopify CDN via `product.images[0].url`
- Brand/lifestyle images: upload to Shopify Files or Cloudflare R2
- Hero slides: replace `HeroSection` `bg` backgrounds with full-bleed images via `<img>` or CSS `background-image`

## Responsive Breakpoints

All components implement `md:` breakpoint (768px) for mobile vs desktop layouts via Tailwind's responsive prefix.
