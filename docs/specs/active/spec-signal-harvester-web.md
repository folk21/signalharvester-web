---
type: Specification
title: SignalHarvester Web initial product specification
description: Active frontend umbrella specification for configuration, operational inspection, Results, live updates, and event-flow diagnostics.
document_role: umbrella
spec_status: active
current_focus: subspecs/ui-production-delivery.md
---
# SignalHarvester Web initial product specification

## Status

Active specification — frontend product target and browser behavior.

This specification refines the browser-facing requirements from the SignalHarvester platform umbrella. The backend repository remains authoritative for REST/OpenAPI, SSE payload contracts, persistence behavior, Kafka/event semantics, and backend business rules.

Frontend implementation details belong here rather than in the backend repository.

## Current implementation focus

The current bounded focus is [`subspecs/ui-production-delivery.md`](subspecs/ui-production-delivery.md). It packages the accepted production frontend as the real independently buildable non-root image required by the backend-owned Kubernetes frontend workload boundary.

`WEB.IDENTITY_ADMIN` and `WEB.VIEWER_RESULTS` were accepted on 2026-09-17 after the canonical frontend verification passed and are archived.

The authentication/authorization foundation and route-delivery slices were also accepted on 2026-09-17 and remain archived.

The accepted baseline already provides Dashboard, Sources CRUD and Source Test, Monitoring Profiles, profile-driven Collection Runs, Analysis inspection, Results list/filter/detail with SSE updates, Event Explorer history/live delivery, Processing Flow, resilience coverage, targeted visual regression, real-backend diagnostic acceptance, accessibility hardening, and responsive/large-data hardening.

## Feature scope

This umbrella owns the browser capabilities cataloged in [`../../FEATURES.md`](../../FEATURES.md). The main feature groups are:

- application/contract boundary: `WEB.APP_SHELL`, `WEB.CONTRACT_INTEGRATION`, `WEB.SERVER_STATE`, `WEB.ASYNC_FEEDBACK`;
- configuration/operations: `WEB.DASHBOARD`, `WEB.SOURCE_CONFIGURATION`, `WEB.SOURCE_TEST`, `WEB.MONITORING_PROFILES`, `WEB.COLLECTION_RUNS`;
- Results/diagnostics: `WEB.ANALYSIS_INSPECTION`, `WEB.RESULTS_BROWSING`, `WEB.RESULTS_LIVE`, `WEB.EVENT_EXPLORER`, `WEB.PROCESSING_FLOW`;
- UX/delivery: `WEB.ACCESSIBILITY`, `WEB.RESPONSIVE_LAYOUT`, `WEB.ROUTE_DELIVERY`, `WEB.PRODUCTION_DELIVERY`;
- security/role-specific presentation: `WEB.AUTH_SESSION`, `WEB.AUTHORIZATION_UX`, `WEB.IDENTITY_ADMIN`, `WEB.VIEWER_RESULTS`;
- verification: `WEB.BROWSER_VERIFICATION`, `WEB.VISUAL_REGRESSION`, `WEB.LIVE_BACKEND_ACCEPTANCE`.

Backend feature IDs listed below are cross-repository references to the capabilities consumed or presented by the browser. Backend behavior and enforcement remain backend-owned.

## Goal

Deliver one coherent SignalHarvester browser application that lets a user configure collection, operate and inspect the processing pipeline, browse durable analyzed Results, receive live updates, and diagnose event flow without direct access to Kafka or PostgreSQL.

The first product should remain useful as an operations/admin UI while growing into the broader SignalHarvester product UI. A separate application is not required merely because later screens are more user-facing.

## Product boundaries

The frontend owns:

- browser navigation and interaction;
- forms and immediate client-side validation;
- REST/SSE consumption;
- presentation of backend state;
- browser-specific loading/error/empty states;
- browser automation and UI-level verification.

The frontend does not own:

- persistence rules;
- collection scheduling semantics;
- deduplication or analysis behavior;
- Kafka offset/retry semantics;
- backend authorization decisions;
- REST/SSE wire contracts.

## Current state

| Capability | State |
|---|---|
| Dashboard | Implemented |
| Source CRUD | Implemented |
| Manual Collection Runs | Implemented |
| Collection Run inspection | Implemented |
| Analysis inspection | Implemented |
| Results list/filter/detail | Implemented |
| Browser automation | Implemented and accepted |
| Monitoring profiles and schedules | Implemented and accepted |
| Source test/preview | Implemented and accepted |
| Live Results via SSE | Implemented and accepted |
| Event Explorer | Implemented and accepted |
| Processing-flow visualization | Implemented and accepted |
| UI resilience / edge-case verification | Implemented and accepted |
| Targeted visual regression | Implemented and accepted |
| Live diagnostic acceptance | Implemented and accepted |
| Accessibility hardening | Implemented and accepted |
| Responsive / large-data UX hardening | Implemented and accepted |
| Frontend performance / runtime resilience | Implemented and accepted |
| Authentication/session and role-aware shell | Implemented and accepted |
| ADMIN identity management | Implemented and accepted |
| Viewer-specific Results presentation | Implemented and accepted |
| Production frontend image | Implemented, verification-pending |

## Requirement map

| Requirement | Frontend feature IDs | Related backend feature IDs |
|---|---|---|
| UI-R1 | `WEB.APP_SHELL` | `DELIVERY.FRONTEND_BACKEND_BOUNDARY` |
| UI-R2 | `WEB.CONTRACT_INTEGRATION` | `CONTRACTS.HTTP`, `DELIVERY.FRONTEND_BACKEND_BOUNDARY` |
| UI-R3 | `WEB.SOURCE_CONFIGURATION` | `CONFIGURATION.SOURCES`, `SECURITY.EXTERNAL_SOURCE_ACCESS` |
| UI-R4 | `WEB.SOURCE_TEST` | `COLLECTION.SOURCE_TEST`, `SECURITY.EXTERNAL_SOURCE_ACCESS` |
| UI-R5 | `WEB.MONITORING_PROFILES` | `CONFIGURATION.MONITORING_PROFILES`, `COLLECTION.SCHEDULING`, `ANALYSIS.CLASSIFICATION` |
| UI-R6 | `WEB.COLLECTION_RUNS` | `COLLECTION.RUNS`, `DATA.PROVENANCE` |
| UI-R7 | `WEB.ANALYSIS_INSPECTION` | `DIAGNOSTICS.ANALYSIS_INSPECTION`, `ANALYSIS.NORMALIZATION`, `ANALYSIS.DEDUPLICATION` |
| UI-R8 | `WEB.RESULTS_BROWSING` | `RESULTS.BROWSING`, `RESULTS.MATERIALIZATION`, `DATA.PROVENANCE` |
| UI-R9 | `WEB.RESULTS_LIVE` | `RESULTS.LIVE`, `CONTRACTS.HTTP` |
| UI-R10 | `WEB.EVENT_EXPLORER` | `DIAGNOSTICS.EVENT_OBSERVATION`, `EVENTING.CORRELATION` |
| UI-R11 | `WEB.PROCESSING_FLOW` | `DIAGNOSTICS.PROCESSING_FLOW`, `EVENTING.CORRELATION`, `DATA.PROVENANCE` |
| UI-R12 | `WEB.ASYNC_FEEDBACK` | `CONTRACTS.HTTP` |
| UI-R13 | `WEB.SERVER_STATE` | `RESULTS.LIVE`, `DIAGNOSTICS.EVENT_OBSERVATION` |
| UI-R14 | `WEB.BROWSER_VERIFICATION`, `WEB.LIVE_BACKEND_ACCEPTANCE` | `TESTING.DETERMINISTIC_LOCAL`, `CONTRACTS.HTTP` |
| UI-R15 | `WEB.CONTRACT_INTEGRATION`, `WEB.ROUTE_DELIVERY` | `DELIVERY.FRONTEND_BACKEND_BOUNDARY`, `CONTRACTS.HTTP` |
| UI-R16 | `WEB.AUTH_SESSION`, `WEB.AUTHORIZATION_UX` | `SECURITY.IDENTITY_ROLES`, `SECURITY.AUTHENTICATION`, `SECURITY.AUTHORIZATION` |
| UI-R17 | `WEB.ACCESSIBILITY` | `DELIVERY.FRONTEND_BACKEND_BOUNDARY` |
| UI-R18 | `WEB.BROWSER_VERIFICATION` | `TESTING.DETERMINISTIC_LOCAL` |
| UI-R19 | `WEB.RESPONSIVE_LAYOUT` | `DELIVERY.FRONTEND_BACKEND_BOUNDARY` |
| UI-R20 | `WEB.ROUTE_DELIVERY` | `DELIVERY.FRONTEND_BACKEND_BOUNDARY` |
| UI-R21 | `WEB.VIEWER_RESULTS`, `WEB.AUTHORIZATION_UX` | `PRESENTATION.VIEWER_RESULTS`, `RESULTS.BROWSING`, `SECURITY.AUTHORIZATION` |
| UI-R22 | `WEB.PRODUCTION_DELIVERY`, `WEB.CONTRACT_INTEGRATION`, `WEB.ROUTE_DELIVERY` | `DEPLOYMENT.KUBERNETES`, `DELIVERY.FRONTEND_BACKEND_BOUNDARY` |

## Requirements

### UI-R1 — one coherent application shell

Feature: `WEB.APP_SHELL`. Related backend: `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.

The product must provide one consistent application shell and navigation model for configuration, operations, Results, and diagnostic screens.

Adding future product-oriented screens must not require a separate frontend repository or duplicate application shell without a concrete lifecycle reason.

### UI-R2 — backend contract fidelity

Feature: `WEB.CONTRACT_INTEGRATION`. Related backend: `CONTRACTS.HTTP`, `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.

REST request and response types must come from the backend OpenAPI contract.

The frontend must not maintain hand-written duplicate DTO definitions for existing OpenAPI schemas. Contract updates must be reproducible through the repository's generation command and must pass TypeScript validation.

Future SSE payloads must also have explicit backend-owned contracts before the frontend depends on them.

### UI-R3 — source configuration

Feature: `WEB.SOURCE_CONFIGURATION`. Related backend: `CONFIGURATION.SOURCES`, `SECURITY.EXTERNAL_SOURCE_ACCESS`.

The UI must allow the user to:

- list configured sources;
- create a source;
- edit a source;
- enable or disable a source;
- delete a source.

Known client-side input errors should be reported before submission where practical. Backend validation remains authoritative.

Current status: implemented for the existing source REST contract.

### UI-R4 — source validation and preview

Feature: `WEB.SOURCE_TEST`. Related backend: `COLLECTION.SOURCE_TEST`, `SECURITY.EXTERNAL_SOURCE_ACCESS`.

When the backend source-test capability exists, the UI must allow a source configuration to be tested without silently inserting test data into the normal Results feed.

The UI should present available diagnostic information such as:

- request success/failure;
- HTTP status;
- fetch/parsing duration;
- candidate item count;
- a bounded extracted-item preview;
- parsing/validation errors.

Current status: implemented and accepted.

### UI-R5 — monitoring profile configuration

Feature: `WEB.MONITORING_PROFILES`. Related backend: `CONFIGURATION.MONITORING_PROFILES`, `COLLECTION.SCHEDULING`, `ANALYSIS.CLASSIFICATION`.

When the backend monitoring-profile contract exists, the UI must support:

- profile CRUD;
- information category;
- enabled/disabled state;
- associated sources;
- collection schedule or interval;
- search/matching criteria;
- analysis settings required by the first product slice.

The UI must make profile/source relationships understandable and editable without process restart or redeployment.

Current status: monitoring-profile CRUD, source assignment, interval, category, enabled state, and criteria are implemented and accepted. Dedicated analysis-setting UI remains pending a backend contract.

### UI-R6 — collection operations and run inspection

Feature: `WEB.COLLECTION_RUNS`. Related backend: `COLLECTION.RUNS`, `DATA.PROVENANCE`.

The UI must allow manually starting a Collection Run and inspecting recent durable runs.

Run inspection must expose enough backend-provided information to understand:

- run identity;
- profile/category context;
- start/finish state;
- requested sources;
- per-source outcomes;
- aggregate publication/failure information.

Current status: implemented for the manual operational API.

### UI-R7 — analysis inspection

Feature: `WEB.ANALYSIS_INSPECTION`. Related backend: `DIAGNOSTICS.ANALYSIS_INSPECTION`, `ANALYSIS.NORMALIZATION`, `ANALYSIS.DEDUPLICATION`.

The UI must provide a bounded technical view of backend-exposed normalized/deduplication state for diagnosis.

This view must not pretend to be the user-facing terminal result model.

Current status: implemented.

### UI-R8 — Results browsing and detail

Feature: `WEB.RESULTS_BROWSING`. Related backend: `RESULTS.BROWSING`, `RESULTS.MATERIALIZATION`, `DATA.PROVENANCE`.

The UI must let users browse durable analyzed Results and inspect one Result in detail.

The list must support backend-provided filters for at least:

- monitoring profile;
- source;
- information category;
- time range;
- relevance/analysis outcome.

Where available, the presentation should expose useful content fields such as title, source, publication/discovery time, link, tags/attributes, score/classification, and relevance.

Large normalized content and detailed provenance should be loaded through the bounded detail representation rather than duplicated into every list row.

Current status: implemented against the current Results REST API. Category-specific presentation can be refined as richer normalized attributes become available.

### UI-R9 — live Results

Feature: `WEB.RESULTS_LIVE`. Related backend: `RESULTS.LIVE`, `CONTRACTS.HTTP`.

When backend SSE is available, an already-open Results view must receive newly available Results without manual refresh.

The UI must:

- reconnect after transient connection loss;
- keep durable REST reads as the recovery/source-of-truth boundary;
- avoid direct Kafka access;
- make connection failure visible when it affects freshness.

Current status: implemented and accepted through backend SSE plus durable REST snapshots.

### UI-R10 — live technical Event Explorer

Feature: `WEB.EVENT_EXPLORER`. Related backend: `DIAGNOSTICS.EVENT_OBSERVATION`, `EVENTING.CORRELATION`.

When the event-observation backend exists, the UI must provide a bounded live diagnostic view of processing events.

Filters should include backend-supported dimensions such as:

- event type;
- producer/service;
- Kafka topic;
- correlation identifier;
- Collection Run;
- content item.

The browser must not expose or emulate unlimited Kafka history.

Current status: implemented and accepted with bounded REST history plus backend SSE.

### UI-R11 — visual processing-flow inspection

Feature: `WEB.PROCESSING_FLOW`. Related backend: `DIAGNOSTICS.PROCESSING_FLOW`, `EVENTING.CORRELATION`, `DATA.PROVENANCE`.

The user must be able to select a Collection Run or collected item and inspect a visual processing path when the backend provides the required correlated read model.

The view should represent relevant stages such as:

- external source;
- collection;
- Kafka publication/consumption;
- normalization;
- deduplication;
- analysis;
- persistence;
- Result availability.

Where available, it should present timestamps, durations, Kafka metadata, retry state, analysis outcome, persisted identity, and trace/correlation identifiers.

Current status: implemented and accepted.

### UI-R12 — explicit async states

Feature: `WEB.ASYNC_FEEDBACK`. Related backend: `CONTRACTS.HTTP`.

Every data-driven screen must handle:

- loading;
- failure;
- successful empty state;
- successful populated state.

Mutations must provide enough feedback to distinguish successful persistence from failed submission.

### UI-R13 — server-state ownership

Feature: `WEB.SERVER_STATE`. Related backend: `RESULTS.LIVE`, `DIAGNOSTICS.EVENT_OBSERVATION`.

Remote state must remain owned by a server-state mechanism such as TanStack Query. Local component state should be used for transient browser interaction.

Do not introduce a second global cache/store for backend data without a concrete requirement.

### UI-R14 — deterministic browser verification

Features: `WEB.BROWSER_VERIFICATION`, `WEB.LIVE_BACKEND_ACCEPTANCE`. Related backend: `TESTING.DETERMINISTIC_LOCAL`, `CONTRACTS.HTTP`.

Core browser workflows must have automated coverage that validates frontend behavior without reproducing backend business tests.

The verification strategy must include:

- controlled REST-response tests for browser behavior;
- at least one opt-in live E2E path against a real separately running backend;
- no mandatory dependency on public internet sources for deterministic acceptance.

This requirement is implemented and accepted. Historical implementation details are preserved in [`../archive/subspecs/ui-browser-verification.md`](../archive/subspecs/ui-browser-verification.md).

### UI-R15 — independent delivery boundary

Features: `WEB.CONTRACT_INTEGRATION`, `WEB.ROUTE_DELIVERY`. Related backend: `DELIVERY.FRONTEND_BACKEND_BOUNDARY`, `CONTRACTS.HTTP`.

The frontend must remain independently buildable and deployable from the backend.

Development may use a Vite reverse proxy. Separately hosted builds must use an explicit backend origin and a compatible backend CORS/security policy.

### UI-R16 — authenticated browser security and backend-authoritative authorization

Features: `WEB.AUTH_SESSION`, `WEB.AUTHORIZATION_UX`. Related backend: `SECURITY.IDENTITY_ROLES`, `SECURITY.AUTHENTICATION`, `SECURITY.AUTHORIZATION`.

The frontend must authenticate through the published backend login/current-principal/logout contract and must support the backend's cookie/CSRF transport for protected REST and native SSE.

Frontend role checks may control routes, navigation, and presentation, but backend authorization must remain authoritative. The browser must not infer role hierarchy; in particular, `ADMIN` must not imply `VIEWER`.

Authentication failure and authorization failure must remain distinct: protected `401` responses end the frontend session, while `403` responses keep the principal authenticated and expose an authorization error.

Current status: authentication/session, role-aware presentation, ADMIN identity management, and viewer-specific Results presentation are implemented and accepted.

### UI-R17 — accessibility and usability baseline

Feature: `WEB.ACCESSIBILITY`. Related backend: `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.

Core workflows must remain keyboard-operable and understandable without relying only on color.

Interactive controls must use appropriate semantic HTML and labels. Browser automation should include basic checks for critical navigation and form accessibility where practical.

Current status: implemented and accepted, including skip navigation, entity-specific repeated-action names, configuration form focus entry/restoration, and semantic status/alert behavior.

### UI-R18 — resilience and edge-case browser verification

Feature: `WEB.BROWSER_VERIFICATION`. Related backend: `TESTING.DETERMINISTIC_LOCAL`.

Deterministic browser verification must cover failure-prone interaction states that are easy to miss during normal visual inspection.

The routine suite should protect, where applicable:

- keyboard-only access to primary inspection/detail actions;
- SSE disconnect/reconnect recovery without duplicate logical rows;
- bounded-history and stale-deep-link behavior;
- partial processing-flow evidence and explicit reconstruction limitations;
- long identifiers/content without document-level horizontal overflow on narrow viewports;
- representative loading, empty, and backend failure states.

Tests must remain deterministic and backend-independent. They should assert user-visible behavior and request boundaries rather than duplicate backend business semantics.

Current status: implemented and accepted.

### UI-R19 — responsive and larger bounded datasets

Feature: `WEB.RESPONSIVE_LAYOUT`. Related backend: `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.

Operational screens must remain usable on phone and tablet layouts and with larger bounded backend responses. Long identifiers and content must stay contained inside their owning surfaces.

Where tabular or graph structure cannot collapse without losing meaning, local scroll regions are preferred over document-level horizontal overflow. The frontend must not invent pagination or truncation semantics that are not present in the backend contract.

Current status: implemented and accepted.

### UI-R20 — efficient route delivery and runtime containment

Feature: `WEB.ROUTE_DELIVERY`. Related backend: `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.

Primary feature screens should be delivered as route-level chunks so the application shell does not eagerly include every operational screen. Route transitions must expose an explicit accessible loading state, and lazy-route failures must remain contained within the shell with a recoverable fallback.

Production verification should preserve the intended dynamic route structure and report generated asset sizes from a measured build. Numeric bundle budgets should be introduced only after the baseline is reviewed.

Current status: implemented and accepted; historical implementation details are archived in [`../archive/subspecs/ui-performance-runtime-resilience.md`](../archive/subspecs/ui-performance-runtime-resilience.md).

### UI-R21 — role-specific consumer Results presentation

Features: `WEB.VIEWER_RESULTS`, `WEB.AUTHORIZATION_UX`. Related backend: `PRESENTATION.VIEWER_RESULTS`, `RESULTS.BROWSING`, `SECURITY.AUTHORIZATION`.

An authenticated principal with explicit `VIEWER` must have a consumer-oriented Result browsing and detail experience that does not require `ADMIN` and does not present operational pipeline or infrastructure diagnostics outside viewer scope.

The viewer experience should reuse the existing Results REST/detail/SSE contracts when they already provide the required data. Different presentation alone must not create a duplicate backend API.

An `ADMIN` + `VIEWER` principal may retain the operational Results presentation with diagnostic cross-navigation. An `ADMIN` principal without `VIEWER` must not gain Results access through frontend role inference.

Current status: implemented and accepted; historical implementation details are archived in [`../archive/subspecs/ui-viewer-results.md`](../archive/subspecs/ui-viewer-results.md).

### UI-R22 — reproducible production frontend image

Features: `WEB.PRODUCTION_DELIVERY`, `WEB.CONTRACT_INTEGRATION`, `WEB.ROUTE_DELIVERY`. Related backend: `DEPLOYMENT.KUBERNETES`, `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.

The frontend must be independently packageable as a production static HTTP image without backend source or backend build artifacts. The runtime must serve the Vite bundle as a non-root process on the platform-agreed container port and preserve React Router deep-link fallback.

The backend origin used by browser REST/SSE must remain an explicit build-time contract through `VITE_API_BASE_URL`; deployment-specific CORS/cookie policy remains backend-owned.

Current status: implemented in [`subspecs/ui-production-delivery.md`](subspecs/ui-production-delivery.md) and verification-pending.

## Non-goals for the current product slice

- duplicating backend business validation in React;
- direct browser access to PostgreSQL or Kafka;
- replacing distributed tracing with the Event Explorer;
- introducing micro-frontends;
- introducing WebSockets where one-way SSE is sufficient;
- adding a large global state framework without demonstrated need;
- making authentication a hidden ad-hoc frontend-only concern.

## Acceptance target

The initial frontend umbrella can be considered complete when:

- the configuration workflows required by the backend platform spec are usable in the browser;
- manual and scheduled processing state can be inspected appropriately;
- Results browsing and live delivery work through explicit backend contracts;
- Event Explorer and processing-flow inspection are available over bounded backend diagnostic APIs;
- core browser workflows have deterministic automated coverage;
- frontend/backend contract generation and independent builds are reproducible;
- the application has an explicit security model appropriate to its deployment exposure.

Completing one sub-spec does not complete this umbrella.
