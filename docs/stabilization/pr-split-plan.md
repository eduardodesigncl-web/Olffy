# PR split plan

The rebased monolith remains a temporary umbrella. Replacement branches must be reconstructed from `main`, not cut from the monolithic branch, and remain draft until their own CI and domain smoke tests pass.

| PR  | Branch                             | Base            | Objective / main paths                                                                                          | Migrations                         | Variables                                  | Dependencies    | Tests                                          | Risk / rollback                          | Status                |
| --- | ---------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------ | --------------- | ---------------------------------------------- | ---------------------------------------- | --------------------- |
| PR0 | `phase0/infra-auth-ci`             | `main`          | CI, stabilization docs, base admin auth/session/rate-limit and safe config                                      | none                               | admin session, cron, safe provider flags   | none            | full CI; login/cookie                          | auth/config scope; revert PR0            | extraction pending    |
| PR1 | `phase0/database-migrations`       | PR0 or `main`   | ordered Supabase schema, RPC and RLS; subdivide foundation vs transactional/loyalty extensions                  | all                                | backend Supabase only                      | PR0             | clean replay, RPC/RLS/advisors                 | critical schema; snapshot + forward fix  | extraction pending    |
| PR2 | `phase0/shopify-catalog`           | PR0             | `lib/shopify/**`, catalog/product/collection APIs and contracts                                                 | none                               | Storefront and Admin credentials separated | PR0             | GID, fixtures, product/catalog smoke           | scopes/source of truth; revert adapters  | extraction pending    |
| PR3 | `phase0/pos-tuu-sales`             | PR1 + PR2       | TUU, DTE, payments, physical POS and reconciliation                                                             | POS/pipeline portions of PR1       | TUU/DTE disabled by default                | PR1, PR2        | signatures, idempotency, compensation          | money side effects; disable flags/revert | extraction pending    |
| PR4 | `phase0/loyalty-sales`             | PR1 + PR2       | points, rules, expiry, claims, reversals, paid-order/refund processing                                          | rules, eligibility, expiry, claims | cron/webhook secrets                       | PR1, PR2        | duplicate webhook, FIFO expiry, refund, claims | double points; disable cron/webhooks     | extraction pending    |
| PR5 | `phase0/admin-panel`               | PR0 + PR2 + PR4 | admin routes/adapters and `src/admin-panel/**`; subdivide dashboard/catalog, customers/loyalty and POS/settings | none                               | admin plus backend vars                    | PR0, PR2, PR4   | auth guards, routes, actions                   | 152 files; revert each UI sub-PR         | mandatory subdivision |
| PR6 | `phase0/customer-account`          | PR1 + PR4       | customer auth/account/history/rewards/claims UI                                                                 | auth/RLS and claims in PR1         | public Supabase only in browser            | PR1, PR4        | login/session, ownership/RLS, render           | PII access; revert UI, retain schema     | extraction pending    |
| PR7 | `phase0/marketing-abandoned-carts` | PR0 + PR1 + PR2 | noop/Klaviyo, outbox cron and abandoned-checkout summary                                                        | marketing outbox in PR1            | provider noop by default                   | PR0, PR1, PR2   | noop, outbox idempotency, query scopes         | consent/scopes; force noop/revert        | extraction pending    |
| PR8 | `phase0/storefront`                | PR2             | public pages/cart/checkout and `src/olffy/**`; subdivide shell/home, catalog/product and cart/checkout          | none                               | public site/storefront vars                | PR2             | build, navigation, catalog/cart fixtures       | 175 files; revert each visual slice      | mandatory subdivision |
| PR9 | `phase0/visual-assets`             | `main` or PR8   | fonts, images and brand-only assets                                                                             | none                               | none                                       | preferably none | licenses/hashes/build/visual smoke             | binary size/license; revert assets       | extraction pending    |

## Merge order

1. PR0.
2. PR1a database foundation, then PR1b transaction/loyalty extensions after disposable replay.
3. PR2.
4. PR4 and PR3 after shared prerequisites, independently where possible.
5. PR6.
6. PR5 sub-PRs.
7. PR7.
8. PR8 sub-PRs.
9. PR9 as consumers become ready.

PR5 and PR8 cannot remain single reviews. PR1 must also separate foundational schema from later transactional/loyalty migrations. Shared layouts, adapters, styles and configuration require hunk-level selection.

## Extraction method

Create each worktree from updated `origin/main`; restore candidate paths from the verified post-rebase backup; select mixed hunks; validate imports/contracts; run complete CI and a domain smoke; commit semantically; push; then open a draft PR with objective, scope, exclusions, dependencies, migrations, variables, evidence, risks and rollback. A coverage row becomes `moved` only after its replacement branch is pushed and verified.
