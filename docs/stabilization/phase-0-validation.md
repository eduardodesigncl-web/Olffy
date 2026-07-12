# Phase 0 validation

Validation commit: `82d06a744d53ff8771c48d63d0583c883a4f99b8`

Clean environments:

- `C:\Users\ednvg\Documents\olffy-phase0-validation-20260712`
- `C:\Users\ednvg\Documents\olffy-phase0-validation-lf-20260712` (`core.autocrlf=false`, equivalent to the Ubuntu checkout used by Actions)

No existing `node_modules` directory from the integration checkout was reused.

| Command / check                                      | Result |             Duration | Evidence / exception                                                                                     |
| ---------------------------------------------------- | -----: | -------------------: | -------------------------------------------------------------------------------------------------------- |
| `npm ci`                                             |   pass |                 36 s | 125 packages installed; 2 moderate audit findings reported, no forced dependency mutation applied        |
| `npm run test:unit`                                  |   pass |              2.429 s | 3 files, 5 tests passed                                                                                  |
| `npm run typecheck`                                  |   pass |             10.801 s | `tsc --noEmit`, exit 0                                                                                   |
| `npm run prettier:check` in default Windows checkout |   fail |              7.000 s | 506 files reported because Git converted LF to CRLF, including files formatted immediately before commit |
| `npm run prettier:check` with `core.autocrlf=false`  |   pass | after clean `npm ci` | `All matched files use Prettier code style!`; matches GitHub's Ubuntu checkout behavior                  |
| `npm run build`                                      |   pass |             26.513 s | Next.js 16.2.9 production build, 64 static pages generated, exit 0                                       |
| GitHub Actions `CI / quality`                        |   pass |    run `29196844857` | install, unit, typecheck, formatting and production build all succeeded                                  |

## Controlled CI failure

- Draft PR: [#2 — test: validate Phase 0 CI failure detection](https://github.com/eduardodesigncl-web/Olffy/pull/2)
- Temporary branch: `phase0/ci-controlled-failure-20260712`
- Intentional failure commit: `34afa4c44264ba18855815c4b4c70d2074a12f68`
- Failing run: `29196887852`, conclusion `failure`
- Corrected commit: `92280d6a17b9c6a72feb1c4791f026fe7f3c156d`
- Recovery run: `29196934568`, conclusion `success`

The test branch is temporary, remains unmerged, and contains no functional change.

## Build observations

- Build completed without production credentials.
- TUU, DTE and marketing remained disabled/noop through safe variables.
- Shopify data calls logged `BAD_REQUEST` while generating fallback pages without credentials; the build still completed successfully.
- Next.js emitted client-side rendering bailout diagnostics for `useSearchParams()`, but completed static generation and returned exit 0.

## Smoke tests

Server: production build on `http://localhost:3100` with a local-only admin test password and session secret. No production credential was used.

| Route / action                              | Status | Duration | Result                                        |
| ------------------------------------------- | -----: | -------: | --------------------------------------------- |
| `/admin/login`                              |    200 |   263 ms | pass                                          |
| `/admin` without session                    |    307 |   144 ms | valid redirect to `/admin/login`              |
| `/admin/ventas` without session             |    307 |     7 ms | valid redirect to `/admin/login`              |
| `/admin/ventas-digitales` without session   |    307 |     6 ms | valid redirect to `/admin/login`              |
| `/cuenta/login`                             |    200 |   223 ms | pass                                          |
| `/cuenta`                                   |    200 |    48 ms | customer account rendered without 5xx         |
| `/tienda`                                   |    200 |    41 ms | storefront/catalog shell rendered without 5xx |
| `POST /api/admin/auth` with test credential |    200 |   108 ms | returned success and signed session cookie    |
| `/admin` with test cookie                   |    200 |   140 ms | dashboard rendered                            |
| `/admin/ventas` with test cookie            |    200 |   104 ms | sales page rendered                           |
| `/admin/ventas-digitales` with test cookie  |    200 |    39 ms | digital sales page rendered                   |

Cookie evidence: present, `HttpOnly`, `Secure` in production mode, `SameSite=Lax`. The secure cookie was explicitly replayed by the local HTTP test client to validate its signature because browsers correctly refuse to send `Secure` cookies over plain HTTP.

## Expected local fallback logs

Authenticated admin pages logged unavailable Supabase/Shopify data because no credentials were provided. The page adapters handled these conditions and returned HTTP 200. These logs are evidence of safe fallback behavior, not proof of live integration connectivity. Live Shopify, Supabase, TUU, DTE and marketing flows remain pending environment-specific QA.
