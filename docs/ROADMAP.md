---
type: Roadmap
title: SignalHarvester Web roadmap
description: Current frontend focus, accepted baseline, next product stages, backend dependencies, and deferred work.
---
# SignalHarvester Web roadmap

## Current position

The current bounded focus is production frontend delivery in [`docs/specs/active/subspecs/ui-production-delivery.md`](specs/active/subspecs/ui-production-delivery.md).

The backend OpenAPI snapshot is synchronized and browser authentication/session, CSRF-aware REST, credentialed SSE, `401`/`403` handling, additive role-aware routing/navigation, and protected deterministic/live acceptance coverage are implemented and accepted.

`WEB.ROUTE_DELIVERY` is implemented and accepted after the 2026-09-17 canonical frontend gate passed.

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

`WEB.IDENTITY_ADMIN` and `WEB.VIEWER_RESULTS` are accepted after the 2026-09-17 canonical repository gate passed.

## Next frontend stages

### 1. Verify the production frontend image

Complete the frontend-owned delivery boundary with the real non-root image expected by the backend Kubernetes manifests. Run the canonical repository gate and the Docker-backed image verification before cross-repository cluster acceptance.

Target features: `WEB.PRODUCTION_DELIVERY`, `WEB.CONTRACT_INTEGRATION`, `WEB.ROUTE_DELIVERY`.

### 2. Add typed Analysis settings to Monitoring Profiles

Dedicated Analysis controls remain blocked on the backend publishing the profile-owned Analysis settings contract.

After that contract exists:

- synchronize OpenAPI;
- regenerate frontend types;
- replace generic-only presentation where typed settings are available;
- keep backend validation authoritative;
- add deterministic browser coverage for create/edit/default/error behavior.

Target feature: `WEB.MONITORING_PROFILES`.

### 3. Expand viewer Results when backend browsing contracts justify it

The first viewer Results slice reuses the existing bounded Results REST/SSE contract and keeps `relevant=true`. If larger product datasets require cursor pagination, search, profile/source display names, or richer category-specific browsing, add those backend contracts before expanding frontend behavior.

Target features: `WEB.VIEWER_RESULTS`, `WEB.RESULTS_BROWSING`.

### 4. Complete cross-repository Kubernetes acceptance

After the frontend image passes its repository-owned verification, load `signalharvester-web:local` into the backend-owned Kubernetes frontend workload and complete platform exposure/CORS/security acceptance there.

Target features: `WEB.PRODUCTION_DELIVERY`, `WEB.CONTRACT_INTEGRATION`, `WEB.AUTH_SESSION`, `WEB.AUTHORIZATION_UX`.

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
