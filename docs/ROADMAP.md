---
type: Roadmap
title: SignalHarvester Web roadmap
description: Current frontend focus, accepted baseline, next product stages, backend dependencies, and deferred work.
---
# SignalHarvester Web roadmap

## Current position

The deployed Kubernetes browser acceptance is accepted after the developer completed the production-image browser workflow on 2026-09-17. The current bounded focus is the verification-pending typed Monitoring Profile Analysis-settings slice in [`docs/specs/active/subspecs/ui-monitoring-profile-analysis-settings.md`](specs/active/subspecs/ui-monitoring-profile-analysis-settings.md).

The backend now publishes and persists profile-owned `MonitoringProfileAnalysisSettings`. The frontend OpenAPI snapshot has been synchronized and the Monitoring Profile workflow now implements contract-derived create/edit controls, deliberate create omission for backend defaults, and replacement-PUT preservation for enable/disable toggles. The slice remains active until canonical frontend verification and developer acceptance complete.

The synchronized backend Results contract also now publishes PostgreSQL text `search`, opaque keyset `cursor`, and `X-Next-Cursor`. That removes the previous contract blocker for the next bounded frontend Results browsing stage; implementation must still preserve the distinct SSE filtering contract rather than reproducing backend search client-side.

Browser authentication/session, CSRF-aware REST, credentialed SSE, `401`/`403` handling, additive role-aware routing/navigation, protected deterministic/live acceptance coverage, production-image delivery, and deployed Kubernetes browser acceptance are implemented and accepted.

`WEB.ROUTE_DELIVERY` is implemented and accepted after the 2026-09-17 canonical frontend gate passed.

The accepted baseline already includes configuration/operations, live Results, Event Explorer, Processing Flow, deterministic/live browser verification, targeted visual regression, accessibility hardening, responsive/large-data containment, and deployed production delivery.

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

### 1. Accept typed Analysis settings for Monitoring Profiles

Complete canonical verification and developer acceptance for the current verification-pending slice. After acceptance, move stable behavior into current-state documentation, archive the sub-spec, and advance the umbrella focus.

Target features: `WEB.MONITORING_PROFILES`, `WEB.CONTRACT_INTEGRATION`, `WEB.BROWSER_VERIFICATION`.

### 2. Consume production-oriented Results browsing

The backend contract now supports text search and opaque keyset continuation. The next bounded frontend spec should define how operational and viewer Results consume:

- backend `search` rather than client-side imitation;
- opaque `cursor` values without decoding or constructing them;
- `X-Next-Cursor` for explicit continuation;
- filter/search changes that reset the continuation chain;
- SSE reconciliation when active REST-only filters such as text search cannot be represented by the stream contract.

Target features: `WEB.VIEWER_RESULTS`, `WEB.RESULTS_BROWSING`, `WEB.RESULTS_LIVE`, `WEB.CONTRACT_INTEGRATION`.

## Backend dependencies

The frontend must not invent missing backend contracts.

No backend contract change is required to finish the current Analysis-settings slice or to begin the next Results search/cursor slice. Future richer viewer browsing may still require backend-owned display-name, sorting, category-specific, or other product contracts before the browser exposes those behaviors.

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
