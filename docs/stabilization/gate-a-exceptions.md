# Gate A exceptions

Gate A is not approved while any exception below remains open.

## GA-001 — Branch Protection not configured

- Task: require `CI / quality`, one approval, updated branch and resolved conversations on `main`.
- Reason: the connected GitHub application exposes PR and workflow operations but not branch-protection/ruleset mutation; GitHub CLI is absent.
- Evidence: successful workflow run `29196844857`; real job name `quality`; see `branch-protection-manual.md`.
- Responsible: repository administrator for `eduardodesigncl-web/Olffy`.
- Deadline: 2026-07-13 23:59 America/Santiago.
- Temporary mitigation: keep PR #1 and replacement PRs in draft; do not merge unless `quality` is successful and review requirements have been checked manually.
- Residual risk: GitHub can currently allow a maintainer to merge without the intended mandatory gate.
- Close condition: repository rules visibly require `quality`, one approval, up-to-date branch and conversation resolution on `main`.

## GA-002 — Disposable database migration execution pending

- Task: execute and verify the ordered Supabase migrations, including reproduction of the `loyalty_lot_remaining()` bigint/numeric mismatch.
- Reason: no disposable/local Supabase database is configured in this checkout; production execution is prohibited.
- Evidence: static migration inventory identifies the uncast `sum(bigint)` window result and isolated corrective migration at `origin/backup/cambios-locales-20260712`.
- Responsible: OLFFY database owner / Supabase project administrator.
- Deadline: before merging the loyalty/database replacement PR.
- Temporary mitigation: keep `20260712120000_fix_lot_remaining_cast.sql` isolated; do not run expiration cron against a newly migrated environment until RPC tests pass.
- Residual risk: expiration/reminder RPCs may fail with SQLSTATE `42804`.
- Close condition: clean migration replay and RPC tests pass on a disposable database, with the corrective migration included exactly once if reproduced.

## GA-003 — Functional replacement PR extraction pending

- Task: reconstruct, validate and publish the functional replacement PRs described in `pr-split-plan.md`.
- Reason: the 422-file monolith contains mixed imports, shared adapters and transactional/UI hunks. Publishing folder-only or empty branches would create misleading, non-buildable PRs and risk dropping unique code.
- Evidence: `pr-file-coverage.csv` classifies all 422 original files; PR5 has 152 and PR8 has 175 candidate files and both require subdivision.
- Responsible: Phase 0 integration owner.
- Deadline: before closing or merging PR #1.
- Temporary mitigation: PR #1 remains draft and unmerged; pre/post-rebase backups preserve the complete implementation; every file remains `pending_review` or `already_in_main` until verified extraction.
- Residual risk: the feature set is not yet independently reviewable or mergeable by domain.
- Close condition: replacement draft PRs are published, CI passes per branch, the coverage matrix has no `pending_review`, and PR #1 body links the complete ordered set.
