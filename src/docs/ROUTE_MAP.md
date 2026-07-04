# OLFFY — Route Map

## App Routes (Next.js App Router)

| Path                   | Component                                  | Description                                       |
| ---------------------- | ------------------------------------------ | ------------------------------------------------- |
| `/`                    | `AppShell` + `HeroSection` + home sections | Home page                                         |
| `/tienda`              | `ShopPage`                                 | Product listing with filters                      |
| `/tienda/[handle]`     | `ProductModal`                             | Product detail (also opens as modal on `/tienda`) |
| `/nuevos-lanzamientos` | `NuevosLanzamientosPage`                   | New collections                                   |
| `/regalos`             | `RegalosPage`                              | Gift guide by tab                                 |
| `/nuestra-historia`    | `NuestraHistoriaPage`                      | Brand story                                       |
| `/contacto`            | `ContactoPage`                             | Contact form, maps, FAQ                           |
| `/cuenta`              | `AccountShell`                             | Login / Register / Dashboard redirect             |
| `/cuenta/dashboard`    | `AccountDashboard`                         | Points hero, stats                                |
| `/cuenta/pedidos`      | `HistoryPage`                              | Order history                                     |
| `/cuenta/recompensas`  | `RewardsPage`                              | Available rewards                                 |
| `/cuenta/canjes`       | `RedemptionsPage`                          | Past redemptions                                  |
| `/checkout`            | `CheckoutPage`                             | Cart → Order confirmation                         |
| `/admin`               | `AdminShell`                               | Password-gated admin panel                        |

## Layout Hierarchy

```
RootLayout (olffy-tokens.css, fonts)
  └── AppShell
        ├── PromoBanner (dismissible)
        ├── Navbar (with CartDrawer portal)
        ├── <page content>
        └── Footer
```

## Modal Routing

ProductModal should be rendered as a parallel route (`@modal`) in Next.js App Router or as an intercepting route at `/tienda/(.)[handle]`.
