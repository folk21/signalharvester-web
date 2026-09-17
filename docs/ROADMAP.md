---
type: Roadmap
title: SignalHarvester Web roadmap
description: Current frontend focus, accepted baseline, next product stages, backend dependencies, and deferred work.
---
# SignalHarvester Web roadmap

## Current position

The current bounded focus is the security foundation in [`docs/specs/active/subspecs/ui-authentication-authorization-foundation.md`](specs/active/subspecs/ui-authentication-authorization-foundation.md).

The backend OpenAPI snapshot has been synchronized and browser authentication/session, CSRF-aware REST, credentialed SSE, `401`/`403` handling, additive role-aware routing/navigation, and protected deterministic/live acceptance coverage are implemented. Developer verification is still pending.

`WEB.ROUTE_DELIVERY` remains a separate active verification-pending slice: its implementation is complete, but its closure acceptance has not yet been run successfully in the current development context.

The accepted baseline already includes configuration/operations, live Results, Event Explorer, Processing Flow, deterministic/live browser verification, targeted visual regression, accessibility hardening, and responsive/large-data containment.

## Accepted product baseline

### Configuration and operations

- `WEB.SOURCE_CONFIGURATION` — Source CRUD and enabled state.
- `WEB.SOURCE_TEST` — bounded persisted-source diagnostic Test and preview.
- `WEB.MONITORING_PROFILES` — profile CRUD, category, interval, criteria, ordered Source membership, and scheduled enabled state.
- `WEB.COLLECTION_RUNS` — profile-driven manual Collection Runs and durable outcome inspection.
- `WEB.DASHBOARD` — bounded operational overview.

### Results and diagnostics

- `WEB.ANALYSIS_INSPECTION` — bounded normalization/deduplication inspection.
- `WEB.RESULTS_BROWSING` — filtered Result list/detail and provenance navigation.
- `WEB.RESULTS_LIVE` — race-free live Result delivery over SSE plus durable REST recovery.
- `WEB.EVENT_EXPLORER` — bounded technical history and live observed events.
- `WEB.PROCESSING_FLOW` — backend-reconstructed run/item processing-flow visualization.

### UX and verification

- `WEB.BROWSER_VERIFICATION` — deterministic backend-independent Playwright coverage.
- `WEB.LIVE_BACKEND_ACCEPTANCE` — bounded real-backend browser path over deterministic local fixtures.
- `WEB.VISUAL_REGRESSION` — one reviewed dense Results/detail golden.
- `WEB.ACCESSIBILITY` — skip navigation, semantic states, accessible naming, keyboard operation, and focus management.
- `WEB.RESPONSIVE_LAYOUT` — phone/tablet and larger bounded-response containment.

## Next frontend stages

### 1. Accept and close the security foundation

Run the current security sub-spec acceptance after dependencies and a protected backend are available. Acceptance includes deterministic login/role/CSRF/SSE coverage, production build checks, visual comparison, `./run_checks.sh`, and the explicit live `ADMIN` + `VIEWER` browser scenario.

After acceptance, move stable behavior into accepted current-state documentation, archive the security sub-spec, and update the umbrella current focus.

### 2. Close route-delivery verification

Complete the still-pending acceptance for `WEB.ROUTE_DELIVERY`, archive its active sub-spec, and update lifecycle indexes. Do not introduce numeric bundle budgets unless a measured baseline and growth policy have been explicitly reviewed.

### 3. Add ADMIN identity management

Expose the synchronized `/api/v1/admin/users/**` contract for explicit `ADMIN` principals. Preserve backend invariants, keep backend validation/authorization authoritative, and do not infer role inheritance in the browser.

Target feature: `WEB.IDENTITY_ADMIN`.

### 4. Add typed Analysis settings to Monitoring Profiles

Dedicated Analysis controls remain blocked on the backend publishing the profile-owned Analysis settings contract.

After that contract exists:

- synchronize OpenAPI;
- regenerate frontend types;
- replace generic-only presentation where typed settings are available;
- keep backend validation authoritative;
- add deterministic browser coverage for create/edit/default/error behavior.

Target feature: `WEB.MONITORING_PROFILES`.

### 5. Build viewer-oriented Results presentation

`VIEWER`-only principals currently receive a safe authenticated placeholder at `/results`; the existing operational Results surface remains restricted in presentation to principals that also have `ADMIN`.

Implement `WEB.VIEWER_RESULTS` as a user-facing Results experience that hides operational/internal details and consumes only backend contracts appropriate to the viewer workflow.

Related backend feature: `PRESENTATION.VIEWER_RESULTS`.

### 6. Complete production delivery integration

Add the real production frontend image/deployment integration required by the platform design, including health/build verification, security/cross-origin deployment policy, and final frontend/backend Kubernetes acceptance.

Target features: `WEB.ROUTE_DELIVERY`, `WEB.CONTRACT_INTEGRATION`, `WEB.AUTH_SESSION`, `WEB.AUTHORIZATION_UX`.

## Backend dependencies

The frontend must not invent missing backend contracts.

Current backend dependencies for upcoming frontend work are:

- profile-owned typed Analysis settings under `CONFIGURATION.MONITORING_PROFILES` / `ANALYSIS.CLASSIFICATION`;
- any production Results pagination/search contract needed for larger viewer browsing under `RESULTS.BROWSING`;
- future changes to authoritative security/OpenAPI shapes under `SECURITY.IDENTITY_ROLES`, `SECURITY.AUTHENTICATION`, and `SECURITY.AUTHORIZATION` (the current security contract is synchronized);
- production deployment/exposure integration under `DEPLOYMENT.KUBERNETES` and `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.

## Deferred until justified

Do not add these without a concrete requirement:

- a second frontend application for product vs admin screens;
- Redux or another global client-state framework;
- a large component framework;
- WebSockets where SSE remains sufficient;
- a service worker/offline mode;
- external browser analytics/error-reporting infrastructure;
- frontend access to Kafka, PostgreSQL, or backend implementation models;
- arbitrary bundle-size budgets without a reviewed measured baseline.
