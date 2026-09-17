---
type: Specification
title: Frontend authentication and authorization foundation
description: Consume the backend JWT/cookie security contract, add browser session lifecycle and CSRF transport, and make the application shell role-aware without duplicating backend authorization.
document_role: subspec
spec_status: completed
parent: ../spec-signal-harvester-web.md
---
# Frontend authentication and authorization foundation

## Status

Completed and accepted on 2026-09-17 after the canonical frontend verification passed.

## Feature scope

- `WEB.CONTRACT_INTEGRATION` — synchronize the checked-in frontend OpenAPI snapshot with the accepted backend security contract.
- `WEB.AUTH_SESSION` — login, current-principal bootstrap, logout, cookie credentials, CSRF proof, and authentication-failure recovery.
- `WEB.AUTHORIZATION_UX` — explicit-role navigation and route presentation while backend authorization remains authoritative.
- `WEB.BROWSER_VERIFICATION` — deterministic browser coverage for authentication and role-specific presentation.
- `WEB.LIVE_BACKEND_ACCEPTANCE` — protected live-browser workflow using explicit test credentials.

Related backend feature IDs:

- `SECURITY.IDENTITY_ROLES`;
- `SECURITY.AUTHENTICATION`;
- `SECURITY.AUTHORIZATION`;
- `CONTRACTS.HTTP`.

Feature identifiers are defined in [`../../FEATURES.md`](../../../FEATURES.md).

## Goal

Move the browser from the previous unauthenticated trusted-environment assumption to the accepted backend authentication/RBAC contract without creating a frontend security model that can disagree with backend enforcement.

The browser must support:

- `POST /api/v1/auth/login`;
- `GET /api/v1/auth/me`;
- `POST /api/v1/auth/logout`;
- HttpOnly JWT cookie authentication for REST and native SSE;
- signed double-submit CSRF for state-changing cookie-authenticated requests;
- explicit additive roles with no inferred hierarchy;
- role-aware navigation and safe deep-link handling;
- deterministic `401` and `403` behavior.

This slice does not implement ADMIN identity management or the final viewer-oriented Results experience.

## Current state

The authoritative backend contract already provides:

- `SIGNALHARVESTER_AUTH` as the HttpOnly JWT browser cookie;
- `XSRF-TOKEN` as the readable signed CSRF cookie;
- `X-CSRF-TOKEN` as the mutation header carrying that proof;
- `USER`, `VIEWER`, `ADMIN`, and `BOT` as additive roles;
- anonymous login;
- authenticated current-principal and logout boundaries;
- `VIEWER` access to Results REST/SSE;
- `ADMIN` access to configuration, operations, and diagnostics;
- ADMIN-only identity-management APIs for a later frontend stage.

The frontend implementation in this slice now consumes that contract. The dedicated `WEB.VIEWER_RESULTS` presentation remains intentionally separate: a viewer-only principal is authenticated and shown a bounded placeholder rather than being given the operational/diagnostic Results workspace.

The earlier `WEB.ROUTE_DELIVERY` slice remains active with `verification-pending` status. It is not redefined by this security stage.

## Requirements

### S1 — authoritative contract synchronization

Features: `WEB.CONTRACT_INTEGRATION`, `WEB.AUTH_SESSION`.

The checked-in `openapi/signalharvester-v1.yaml` must match the current authoritative backend OpenAPI contract for authentication, roles, and identity administration.

Application code must use OpenAPI-derived aliases for login/current-principal role shapes. It must not create independent REST DTO definitions for those schemas.

`src/api/generated.ts` remains generated output and must be produced by `npm run api:generate`; it must not be maintained manually.

### S2 — authentication bootstrap

Feature: `WEB.AUTH_SESSION`.

On application startup the browser must call `GET /api/v1/auth/me` with browser credentials enabled.

The browser must handle the result as follows:

1. `200` — store the returned principal as authenticated server state and continue to the requested protected route when its role requirements are satisfied;
2. `401` — treat the browser as anonymous and route protected navigation to `/login`;
3. other failures — keep the failure explicit and provide a retry action rather than silently treating infrastructure failure as anonymous access.

The frontend must not read, decode, or persist the HttpOnly JWT.

### S3 — login lifecycle

Feature: `WEB.AUTH_SESSION`.

`/login` must provide username/password authentication through `POST /api/v1/auth/login`.

After a successful login response the browser must re-read `GET /api/v1/auth/me` instead of constructing the principal from form input or JWT contents.

When login began from a protected deep link, the browser should return to that location only if the authenticated principal has the frontend role required for that route. Otherwise it must use the principal's role-appropriate home route.

A `401` login response must remain on the login screen and present an explicit invalid-credentials/disabled-account error.

Passwords must remain page-local form state and must not be stored in TanStack Query, local storage, session storage, URLs, or logs.

### S4 — credentialed REST and CSRF transport

Features: `WEB.AUTH_SESSION`, `WEB.CONTRACT_INTEGRATION`.

All frontend REST calls must use browser credentials so HttpOnly cookie authentication also works when the backend is reached through an explicitly allowed credentialed origin.

For state-changing requests other than anonymous login, the API adapter must:

1. read `XSRF-TOKEN` from `document.cookie` when present;
2. send the exact value in `X-CSRF-TOKEN`;
3. never copy the JWT cookie into JavaScript or a request URL.

The backend remains authoritative if a mutation rejects missing or invalid CSRF proof.

### S5 — credentialed native SSE

Feature: `WEB.AUTH_SESSION`.

Results and Event Observation must keep native `EventSource` transport and open streams with `withCredentials: true`.

JWT or CSRF credentials must not be added to SSE URLs or query parameters.

Existing SSE `ready`, buffering, reconnect, and durable REST recovery semantics remain unchanged.

### S6 — logout and session cleanup

Feature: `WEB.AUTH_SESSION`.

Logout must call `POST /api/v1/auth/logout` through the normal credentialed/CSRF-protected API adapter.

After successful logout, the frontend must:

- clear the current principal;
- remove cached non-authenticated application server state so a subsequent identity cannot see stale data from the previous identity;
- return protected navigation to `/login`.

If logout receives `401`, the frontend must still treat the local browser session as ended. A `403` CSRF failure must remain visible and must not pretend that backend credential clearing succeeded.

### S7 — explicit additive roles in navigation

Feature: `WEB.AUTHORIZATION_UX`.

Frontend role checks exist only for navigation and presentation. They must not be described or implemented as security enforcement.

The browser must not infer role hierarchy:

- `ADMIN` does not imply `VIEWER`;
- `VIEWER` does not imply `ADMIN`;
- baseline `USER` alone grants no operational or viewer screen;
- `BOT` alone grants no browser workflow in this slice.

Current presentation rules are:

- `ADMIN` exposes Dashboard, Sources, Monitoring Profiles, Collection Runs, Analysis Items, Event Explorer, and Processing Flow;
- operational Results are exposed only when the principal has both `ADMIN` and `VIEWER` because that screen contains administrative/diagnostic cross-navigation;
- a viewer-only principal may navigate to `/results`, but receives a safe placeholder until `WEB.VIEWER_RESULTS` is implemented;
- a principal without an implemented browser capability receives an authenticated no-capability state rather than being given another role implicitly.

### S8 — deep-link authorization UX

Feature: `WEB.AUTHORIZATION_UX`.

Direct navigation to a protected route must remain deterministic:

- anonymous principal -> `/login` with the requested location retained for post-login navigation;
- authenticated principal missing the required role -> an explicit Access denied state inside the authenticated shell;
- unknown route -> role-appropriate home routing through `/`.

Route guards must prevent unauthorized screen components from mounting merely to discover a backend `403`.

### S9 — `401` and `403` request handling

Features: `WEB.AUTH_SESSION`, `WEB.AUTHORIZATION_UX`.

A `401` from a protected application request must invalidate the frontend principal and cached application data, causing protected navigation to return to login.

A `403` must keep the principal authenticated and present an authorization error. It must not be converted into a logout or anonymous state.

Useful backend-provided error text may be preserved. When no useful body is available, the frontend must present stable authentication/authorization fallback messages.

### S10 — role-sensitive operational cross-links

Feature: `WEB.AUTHORIZATION_UX`.

Admin/diagnostic screens must not offer Result links to an `ADMIN` principal that lacks `VIEWER`.

Dashboard must not call the Results backend boundary when the current `ADMIN` principal lacks `VIEWER`.

This avoids relying on a hidden role hierarchy and avoids predictable backend `403` responses for capabilities the frontend already knows are absent.

### S11 — protected live-backend acceptance

Features: `WEB.LIVE_BACKEND_ACCEPTANCE`, `WEB.AUTH_SESSION`.

The opt-in live browser workflow must authenticate through the UI before configuration/diagnostic work begins.

It requires explicit test credentials supplied through:

- `SIGNALHARVESTER_LIVE_USERNAME`;
- `SIGNALHARVESTER_LIVE_PASSWORD`.

The account used by the existing cross-project live scenario must have both `ADMIN` and `VIEWER`, because the scenario exercises configuration/diagnostics and Results REST/SSE.

Live cleanup must use the authenticated browser context and CSRF proof rather than bypassing the protected backend with an unauthenticated API client.

## Authentication sequence

For a fresh protected browser navigation:

1. `AuthSessionProvider` requests `GET /api/v1/auth/me` with credentials.
2. Anonymous state redirects the protected location to `/login` while retaining the requested path.
3. Login sends only username/password to `POST /api/v1/auth/login`.
4. The backend sets browser auth/CSRF cookies.
5. The frontend requests `GET /api/v1/auth/me` again.
6. The returned explicit roles determine which navigation and route presentation are available.
7. Normal API/SSE work uses cookies through browser credential transport; JavaScript never reads the JWT.

## Failure semantics

- Login `401`: remain anonymous; show invalid-credentials/disabled-account feedback.
- `GET /auth/me` `401`: anonymous state, not an infrastructure error.
- `GET /auth/me` non-`401` failure: explicit bootstrap error with retry.
- Protected application request `401`: invalidate principal and application cache; return to login.
- Protected application request `403`: keep session; show authorization failure.
- Logout `401`: local state becomes anonymous because the backend already considers the request unauthenticated.
- Logout `403`: keep the current principal and expose the failure.
- Missing readable CSRF cookie: send no fabricated proof; allow the backend to reject the mutation.

## Non-goals

This slice does not:

- implement `WEB.IDENTITY_ADMIN` screens over `/api/v1/admin/users/**`;
- implement the final `WEB.VIEWER_RESULTS` list/detail experience;
- infer object-level authorization beyond published roles;
- add refresh-token or server-side session storage;
- inspect or decode JWT contents in JavaScript;
- add OAuth/OIDC, MFA, registration, password reset, or identity federation;
- change backend role/endpoint policy;
- treat route hiding as security enforcement;
- change the backend `SameSite`, `Secure`, CORS, token lifetime, or signing configuration.

## Compatibility and deployment

The preferred browser deployment remains one controlled application origin or the normal Vite `/api` development proxy. Cross-origin `VITE_API_BASE_URL` deployments work only when backend CORS and cookie policy explicitly support that deployment.

A backend started in the previous security-disabled trusted compatibility mode does not satisfy this frontend authentication workflow. Live security acceptance must use the backend `security` environment and deployment-owned secrets/credentials.

The deterministic Playwright suite remains backend-independent by mocking the published REST/SSE boundaries.

## Validation

This slice is accepted when all of the following pass after dependencies are available:

```bash
npm run api:generate
npm run typecheck
npm test
npm run e2e
npm run build
npm run build:assets
npm run e2e:visual
./run_checks.sh
```

Deterministic browser coverage must verify at least:

- anonymous deep-link redirect to login;
- failed and successful login;
- current-principal bootstrap;
- logout with CSRF proof;
- viewer-only navigation isolation;
- `ADMIN` without implicit `VIEWER`;
- mutation CSRF header construction;
- credentialed EventSource construction;
- `401` session invalidation;
- `403` authorization error presentation.

The opt-in protected live scenario additionally runs with explicit backend/security credentials:

```bash
SIGNALHARVESTER_BACKEND_URL=http://127.0.0.1:8080 \
SIGNALHARVESTER_LIVE_USERNAME=<admin-viewer-user> \
SIGNALHARVESTER_LIVE_PASSWORD=<password> \
npm run e2e:live
```

The live backend must also permit the deterministic local fixture destination according to its external-source security configuration.
