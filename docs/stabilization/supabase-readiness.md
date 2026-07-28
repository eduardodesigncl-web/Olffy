# Supabase admin credential and readiness

## Canonical behavior

The backend accepts the new `SUPABASE_SECRET_KEY` and the legacy
`SUPABASE_SERVICE_ROLE_KEY`, but it never selects a key merely because the
variable is non-empty. Each candidate is validated as a server-side key.

Selection order:

1. valid `SUPABASE_SECRET_KEY` (`sb_secret_...` or a legacy service-role JWT);
2. valid `SUPABASE_SERVICE_ROLE_KEY` JWT with `role=service_role`;
3. fail fast with variable names only, never values.

When a legacy JWT includes a project `ref`, it must match the project reference
in `NEXT_PUBLIC_SUPABASE_URL`. Publishable and anon keys are rejected.

## Probes

- `GET /api/health` is liveness-only and never contacts a provider.
- `GET /api/readiness` performs a head-only query against
  `loyalty_customers`. It returns `200` only when Supabase is reachable with a
  valid administrative credential, otherwise generic `503` without leaking
  provider messages or keys.

## Rotation procedure

1. Create a new Supabase `sb_secret_` key in the project dashboard.
2. Configure `SUPABASE_SECRET_KEY` separately in Local, Preview, Staging and
   Production without copying it into code, tickets or logs.
3. Verify `/api/readiness` in each environment.
4. Remove `SUPABASE_SERVICE_ROLE_KEY` after all environments pass.
5. Revoke the old key in Supabase and repeat readiness checks.

Actual key creation, environment mutation and revocation require an authorized
operator and are intentionally not performed by repository code.
