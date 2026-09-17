---
type: Roadmap
title: SignalHarvester Web roadmap
description: Current frontend focus, accepted baseline, next product stages, backend dependencies, and deferred work.
---
# SignalHarvester Web roadmap

## Current position

The current bounded focus is `WEB.ROUTE_DELIVERY` in [`docs/specs/active/subspecs/ui-performance-runtime-resilience.md`](specs/active/subspecs/ui-performance-runtime-resilience.md).

Implementation is complete and verification is pending. Acceptance requires the focused route-loading/failure scenarios, deterministic browser suite, production build/manifest checks, asset report, reviewed visual comparison, and canonical repository gate.

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

### 1. Close route-delivery verification

Complete acceptance for `WEB.ROUTE_DELIVERY`, archive the active sub-spec, and update current-state documentation/lifecycle indexes in one closure change.

Do not introduce numeric bundle budgets during closure unless a measured baseline and growth policy have been explicitly reviewed.

### 2. Synchronize backend contracts for security

Backend security capabilities now exist under `SECURITY.IDENTITY_ROLES`, `SECURITY.AUTHENTICATION`, and `SECURITY.AUTHORIZATION`.

Before frontend security implementation:

- update the checked-in OpenAPI snapshot from the authoritative backend contract;
- regenerate TypeScript types;
- review cookie, CSRF, CORS, `401`/`403`, and identity/role shapes as published by the backend;
- define a bounded frontend security sub-spec.

Target frontend features: `WEB.AUTH_SESSION`, `WEB.AUTHORIZATION_UX`.

### 3. Implement authentication/session and role-aware shell

Implement browser authentication/session behavior over the synchronized backend contract.

The UI should provide login/session lifecycle, credentialed API behavior, explicit authentication/authorization failure handling, and role-aware navigation while keeping backend authorization authoritative.

Target frontend features: `WEB.AUTH_SESSION`, `WEB.AUTHORIZATION_UX`.

### 4. Add ADMIN identity management

Expose backend-supported identity administration for users with the required ADMIN capability. Preserve backend invariants and do not infer role inheritance in the browser.

Target feature: `WEB.IDENTITY_ADMIN`.

### 5. Add typed Analysis settings to Monitoring Profiles

Dedicated Analysis controls remain blocked on the backend publishing the profile-owned Analysis settings contract.

After that contract exists:

- synchronize OpenAPI;
- regenerate frontend types;
- replace generic-only presentation where typed settings are available;
- keep backend validation authoritative;
- add deterministic browser coverage for create/edit/default/error behavior.

Target feature: `WEB.MONITORING_PROFILES`.

### 6. Build viewer-oriented Results presentation

Add `WEB.VIEWER_RESULTS` after the backend role/authorization model and Results contract are ready for the intended viewer workflow.

Viewer presentation should focus on user-facing analyzed Results and hide operational/internal details that belong to admin/diagnostic screens.

Related backend feature: `PRESENTATION.VIEWER_RESULTS`.

### 7. Complete production delivery integration

Add the real production frontend image/deployment integration required by the platform design, including health/build verification and final frontend/backend Kubernetes acceptance.

Target features: `WEB.ROUTE_DELIVERY`, `WEB.CONTRACT_INTEGRATION`, `WEB.AUTH_SESSION`, `WEB.AUTHORIZATION_UX`.

## Backend dependencies

The frontend must not invent missing backend contracts.

Current backend dependencies for upcoming frontend work are:

- profile-owned typed Analysis settings under `CONFIGURATION.MONITORING_PROFILES` / `ANALYSIS.CLASSIFICATION`;
- any production Results pagination/search contract needed for larger viewer browsing under `RESULTS.BROWSING`;
- authoritative security/OpenAPI shapes under `SECURITY.IDENTITY_ROLES`, `SECURITY.AUTHENTICATION`, and `SECURITY.AUTHORIZATION`;
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
