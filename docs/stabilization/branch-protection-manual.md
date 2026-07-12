# Branch protection manual configuration

Phase 0 produced and executed the real GitHub Actions workflow `CI`. The successful job/check name observed on run `29196844857` is `quality`.

The available GitHub connector does not expose branch-protection/ruleset mutations, and GitHub CLI is not installed locally. Therefore protection was not configured automatically.

## Required GitHub configuration

1. Open repository **Settings**.
2. Open **Branches** (or **Rules → Rulesets** if the repository uses rulesets).
3. Select **Add branch protection rule**.
4. Set branch name pattern to `main`.
5. Enable **Require a pull request before merging**.
6. Set required approvals to `1`.
7. Enable **Require status checks to pass before merging**.
8. Select the real check `quality` from workflow `CI` after its successful run is indexed.
9. Enable **Require branches to be up to date before merging**.
10. Enable **Require conversation resolution before merging**.
11. Prevent merge when required checks are pending or failing.
12. Save the rule and verify it using a draft/test PR; do not merge PR #1.

Do not select a Vercel deployment status as a replacement for `quality`.
