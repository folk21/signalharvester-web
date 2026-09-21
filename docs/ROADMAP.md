---
type: Roadmap
title: SignalHarvester Web roadmap
description: Current frontend focus, accepted baseline, next product stages, backend dependencies, and deferred work.
---
# SignalHarvester Web roadmap

## Current position

Typed Monitoring Profile Analysis settings and production-oriented Results browsing are accepted after the developer confirmed the canonical frontend gate passed on 2026-09-21. Their completed sub-specifications are archived.

Both operational and viewer Results consume backend `search`, opaque `cursor`, and `X-Next-Cursor`, with explicit continuation and logical-row de-duplication. Results SSE remains a separate backend contract: REST search/cursors are never sent to the stream, and active text search reconciles received Result events through a fresh authoritative REST first page instead of browser-side full-text matching.

There is currently no bounded frontend implementation focus. The next product slice should be chosen from concrete user feedback, dataset scale, or an explicit operational need. Backend-owned display data, sorting semantics, category-specific fields, cleanup behavior, or other server semantics must be published by the backend before the browser depends on them.

Browser authentication/session, CSRF-aware REST, credentialed SSE, `401`/`403` handling, additive role-aware routing/navigation, protected deterministic/live acceptance coverage, typed Monitoring Profile Analysis settings, production-oriented Results browsing, production-image delivery, and deployed Kubernetes browser acceptance are implemented and accepted.

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

### 1. Select the next bounded product slice from evidence

Use actual product feedback, representative dataset size, or a concrete operational workflow to decide the next bounded frontend change. Likely candidates include profile/source display names in Results, explicit backend sorting, category-specific presentation, saved searches, or another viewer workflow. Do not select one merely because it is technically possible.

### 2. Add backend contracts first when the selected slice needs backend-owned semantics

If the selected frontend need requires new display data, ordering/search semantics, cleanup operations, or authorization behavior, define and accept the corresponding backend contract/specification before implementing browser behavior. Pure presentation changes over already published contracts can remain frontend-only.

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
