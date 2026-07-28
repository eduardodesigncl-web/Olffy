# OLFFY Phase 0 Baseline

## Snapshot

- UTC timestamp: `2026-07-12T14:36:44Z`
- Repository: `eduardodesigncl-web/Olffy`
- Pull request: [#1 — Implement admin panel frontend](https://github.com/eduardodesigncl-web/Olffy/pull/1)
- Main branch: `main`
- PR branch: `codex/integrar-frontend-claude`
- Initial `origin/main`: `c1de351095a3ee290a2901a3bb56a3dd745d3dfb`
- Initial PR head: `bb326efb7e1795bd9f2a94c3492c614176073746`
- Initial merge-base: `12cc63e9acc1ce9b12b0d0a8ed774d2dc0cd12f2`
- Divergence (`origin/main...PR`): 2 behind, 20 ahead
- PR size: 422 files, 36,155 additions, 3,415 deletions
- GitHub state: open, draft, not merged, not mergeable
- GitHub Actions workflows in `main`: none
- GitHub Actions workflows in PR head: none
- Vercel state: not independently verified; Vercel status is not accepted as CI evidence
- Working tree at revalidation: clean

## Existing migrations

`origin/main` contains 9 migrations. The PR head contains 15 migrations. The six PR-only migrations are:

1. `20260703120000_add_contact_messages.sql`
2. `20260704130000_add_tuu_remote_pos_attempt_payload.sql`
3. `20260710130000_versioned_loyalty_rules.sql`
4. `20260711120000_eligible_total_physical_sale.sql`
5. `20260711130000_loyalty_points_expiration.sql`
6. `20260711140000_guest_pending_claims.sql`

The local-only migration `20260712120000_fix_lot_remaining_cast.sql` is isolated in `origin/backup/cambios-locales-20260712` at `68bb2616906b84980317ae855a9aa1cc724679d5` and is not part of the integration branch.

## Configuration observed

`vercel.json` has three daily Hobby-compatible schedules:

- marketing event processing: `0 12 * * *`
- Shopify paid-order synchronization: `0 13 * * *`
- loyalty point expiration: `0 11 * * *`

No schedule runs more than once per day and `*/30 * * * *` is absent.

## Initial risks

- The PR is monolithic and combines transaction logic, migrations, admin UI, storefront UI and binary assets.
- The PR branch is behind `main`, whose two commits also touch digital sales and Vercel cron configuration.
- Digital sales exist on both sides of the rebase and require explicit idempotency and route review.
- Six additional shared migrations require dependency, RPC, RLS and ordering review.
- A separate local cast fix for `lot_remaining` may overlap the loyalty migrations and must not be applied automatically.
- No GitHub Actions workflow exists at the recorded refs.
- Vercel deployment/check state has not been verified independently.

## Commands used

```text
git status --short --branch
git branch --show-current
git remote -v
git fetch origin --prune --tags
git show-ref --verify refs/remotes/origin/backup/cambios-locales-20260712
git rev-parse origin/backup/cambios-locales-20260712
git show --stat --oneline --decorate --no-renames 68bb2616906b84980317ae855a9aa1cc724679d5
git rev-parse origin/main
git rev-parse origin/codex/integrar-frontend-claude
git merge-base origin/main origin/codex/integrar-frontend-claude
git rev-list --left-right --count origin/main...origin/codex/integrar-frontend-claude
git log --oneline --decorate --graph --all -n 50
git diff --stat origin/main...origin/codex/integrar-frontend-claude
git diff --name-status origin/main...origin/codex/integrar-frontend-claude
git diff --numstat origin/main...origin/codex/integrar-frontend-claude
git ls-tree -r --name-only origin/main -- .github/workflows supabase/migrations
git ls-tree -r --name-only origin/codex/integrar-frontend-claude -- .github/workflows supabase/migrations
```

PR metadata was retrieved through the connected GitHub application on 2026-07-12. The public unauthenticated API had previously returned a rate-limit error and was not used as evidence.

## Rebase outcome

- Pre-rebase remote branch: `backup/pr-1-before-rebase-20260712-1436-bb326ef`
- Pre-rebase annotated tag: `backup-pr1-before-rebase-20260712-1436-bb326ef`
- Both resolve to original head `bb326efb7e1795bd9f2a94c3492c614176073746`.
- Rebase completed without textual conflicts.
- Git skipped equivalent commits `a415c58` (digital sales) and `372c14c` (Hobby cron) because their patches were already in `main` as `9fd6f47` and `c1de351`.
- Tree comparison between the original backup and rebased result found no missing original change; before Phase 0 docs/CI, the only tree difference was the new baseline document.
- Published with explicit `--force-with-lease` expecting remote `bb326ef`.
- First published stabilized/CI head: `82d06a744d53ff8771c48d63d0583c883a4f99b8`.
- Final merge-base after rebase: `c1de351095a3ee290a2901a3bb56a3dd745d3dfb`.
- Verified divergence after publication: 0 behind, 20 ahead.
