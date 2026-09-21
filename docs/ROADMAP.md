---
type: Roadmap
title: SignalHarvester Web roadmap
description: Current frontend focus, accepted baseline, next product stages, backend dependencies, and deferred work.
---
# SignalHarvester Web roadmap

## Current position

Typed Monitoring Profile Analysis settings were accepted on 2026-09-21 after the developer confirmed the canonical frontend gate passed. The completed sub-spec is archived.

The current bounded focus is verification-pending production-oriented Results browsing in [`docs/specs/active/subspecs/ui-results-production-browsing.md`](specs/active/subspecs/ui-results-production-browsing.md). Both operational and viewer Results now consume backend `search`, opaque `cursor`, and `X-Next-Cursor`, with explicit continuation and logical-row de-duplication.

Results SSE remains a separate backend contract. REST search/cursors are never sent to the stream. When text search is active, a received Result SSE event triggers a first-page REST reconciliation instead of client-side imitation of backend full-text search.

Browser authentication/session, CSRF-aware REST, credentialed SSE, `401`/`403` handling, additive role-aware routing/navigation, protected deterministic/live acceptance coverage, typed Monitoring Profile Analysis settings, production-image delivery, and deployed Kubernetes browser acceptance are implemented and accepted.

`WEB.ROUTE_DELIVERY` is implemented and accepted after the 2026-09-17 canonical frontend gate passed.

The accepted baseline already includes configuration/operations, live Results, Event Explorer, Processing Flow, deterministic/live browser verification, targeted visual regression, accessibility hardening, responsive/large-data containment, and deployed production delivery.

## Accepted product baseline

### Configuration and operations

- `WEB.SOURCE_CONFIGURATION` — Source CRUD and enabled state.
- `WEB.SOURCE_TEST` — bounded persisted-source diagnostic Test and preview.
- `WEB.MONITORING_PROFILES` — profile CRUD, category, interval, criteria, typed Analysis settings, ordered Source membership, and scheduled enabled state.
- `WEB.COLLECTION_RUNS` — profile-driven manual Collection Runs and durable outcome inspection.
- `WEB.DASHBOARD` — bounded operational overview.

### Results and diagnostics

- `WEB.ANALYSIS_INSPECTION` — bounded normalization/deduplication inspection.
- `WEB.RESULTS_BROWSING` — filtered Result list/detail and provenance navigation.
- `WEB.RESULTS_LIVE` — race-free live Result delivery over SSE plus durable REST recovery.
- `WEB.EVENT_EXPLORER` — bounded technical history and live observed events.
- `WEB.PROCESSING_FLOW` — backend-reconstructed run/item processing-flow visualization.

### UX, security, delivery, and verification

- `WEB.BROWSER_VERIFICATION` — deterministic backend-independent Playwright coverage.
- `WEB.LIVE_BACKEND_ACCEPTANCE` — bounded real-backend browser path over deterministic local fixtures, including the accepted deployed Kubernetes production-browser run.
- `WEB.VISUAL_REGRESSION` — one reviewed dense Results/detail golden.
- `WEB.ACCESSIBILITY` — skip navigation, semantic states, accessible naming, keyboard operation, and focus management.
- `WEB.RESPONSIVE_LAYOUT` — phone/tablet and larger bounded-response containment.
- `WEB.PRODUCTION_DELIVERY` — reproducible non-root production image and static SPA runtime verified independently and through the backend-owned Kubernetes workload.
- `WEB.AUTH_SESSION`, `WEB.AUTHORIZATION_UX`, and `WEB.IDENTITY_ADMIN` — accepted authenticated role-aware browser workflows and identity administration.
- `WEB.VIEWER_RESULTS` — accepted consumer-oriented relevant Results presentation.

## Next frontend stages

### 1. Accept production-oriented Results browsing

Complete canonical verification and developer acceptance for the current verification-pending slice. After acceptance, move stable search/continuation/reconciliation behavior into current-state documentation, archive the sub-spec, and advance the umbrella focus.

Target features: `WEB.VIEWER_RESULTS`, `WEB.RESULTS_BROWSING`, `WEB.RESULTS_LIVE`, `WEB.CONTRACT_INTEGRATION`, `WEB.BROWSER_VERIFICATION`.

### 2. Reconcile the next viewer/product browsing need

After production-oriented Results browsing is accepted, use actual product feedback and dataset scale to decide whether the next bounded slice needs profile/source display names, explicit sorting, category-specific presentation, saved searches, or another viewer workflow. Add backend contracts first when those capabilities require backend-owned data or semantics.

## Backend dependencies

The frontend must not invent missing backend contracts.

No backend contract change is required to finish the current Results search/cursor slice. Future richer viewer browsing may still require backend-owned display-name, sorting, category-specific, or other product contracts before the browser exposes those behaviors.

Future authoritative security/OpenAPI changes remain backend-owned under `SECURITY.IDENTITY_ROLES`, `SECURITY.AUTHENTICATION`, and `SECURITY.AUTHORIZATION`.

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
