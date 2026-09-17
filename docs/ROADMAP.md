---
type: Roadmap
title: SignalHarvester Web roadmap
description: Current frontend focus, accepted baseline, next product stages, backend dependencies, and deferred work.
---
# SignalHarvester Web roadmap

## Current position

The deployed Kubernetes browser acceptance is accepted after the developer completed the production-image browser workflow on 2026-09-17. The current bounded focus is typed Monitoring Profile Analysis settings in [`docs/specs/active/subspecs/ui-monitoring-profile-analysis-settings.md`](specs/active/subspecs/ui-monitoring-profile-analysis-settings.md).

That slice is contract-blocked. The checked-in backend OpenAPI snapshot still exposes the generic Monitoring Profile `criteria` map but no profile-owned Analysis-settings schema, so the frontend must not implement hidden conventions ahead of the backend contract.

The backend OpenAPI snapshot is otherwise synchronized and browser authentication/session, CSRF-aware REST, credentialed SSE, `401`/`403` handling, additive role-aware routing/navigation, protected deterministic/live acceptance coverage, production-image delivery, and deployed Kubernetes browser acceptance are implemented and accepted.

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

### 1. Add typed Analysis settings to Monitoring Profiles

This is the current frontend focus, but implementation is blocked on the backend publishing and using the profile-owned Analysis settings contract.

After that contract exists:

- synchronize OpenAPI;
- regenerate frontend types;
- add typed controls separate from the generic `criteria` map;
- preserve the settings through create/edit and replacement-style enabled-state updates;
- keep backend validation authoritative;
- add deterministic browser coverage for create/edit/default/error and toggle-preservation behavior.

Target features: `WEB.MONITORING_PROFILES`, `WEB.CONTRACT_INTEGRATION`, `WEB.BROWSER_VERIFICATION`.

### 2. Expand viewer Results when backend browsing contracts justify it

The first viewer Results slice reuses the existing bounded Results REST/SSE contract and keeps `relevant=true`. If larger product datasets require cursor pagination, search, profile/source display names, or richer category-specific browsing, add those backend contracts before expanding frontend behavior.

Target features: `WEB.VIEWER_RESULTS`, `WEB.RESULTS_BROWSING`.

## Backend dependencies

The frontend must not invent missing backend contracts.

Current backend dependencies for upcoming frontend work are:

- profile-owned typed Analysis settings under `CONFIGURATION.MONITORING_PROFILES` / `ANALYSIS.CLASSIFICATION`;
- any production Results pagination/search contract needed for larger viewer browsing under `RESULTS.BROWSING`;
- future changes to authoritative security/OpenAPI shapes under `SECURITY.IDENTITY_ROLES`, `SECURITY.AUTHENTICATION`, and `SECURITY.AUTHORIZATION` (the current security contract is synchronized).

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
