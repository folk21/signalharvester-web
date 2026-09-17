---
type: Implementation Guide
title: Current implementation
description: Current SignalHarvester Web screens, API usage, browser state, verification, and known limitations.
---
# Current implementation

## Purpose

This document describes accepted and currently implemented frontend behavior. Active specifications describe intended or verification-pending changes and must not be read as implementation evidence by themselves.

Stable frontend capability IDs are defined in [`FEATURES.md`](FEATURES.md).

## Current product surface

The application remains one coherent operational/product frontend.

Configuration and operations:

- **Dashboard** (`/`) — bounded overview built from existing Source, Monitoring Profile, Collection Run, Analysis, and Results reads. Feature: `WEB.DASHBOARD`.
- **Sources** (`/sources`) — Source CRUD, enabled state, and persisted Source Test. Features: `WEB.SOURCE_CONFIGURATION`, `WEB.SOURCE_TEST`.
- **Monitoring Profiles** (`/profiles`) — profile CRUD, information category, scheduled enabled state, collection interval, ordered source membership, and criteria. Feature: `WEB.MONITORING_PROFILES`.
- **Collection Runs** (`/runs`) — profile-driven manual runs, recent durable runs, and per-source/item outcomes. Feature: `WEB.COLLECTION_RUNS`.

Results and diagnostics:

- **Analysis Items** (`/analysis`) — bounded normalized/deduplication inspection with profile/source filters. Feature: `WEB.ANALYSIS_INSPECTION`.
- **Results** (`/results`) — role-specific Result presentation: the existing operational list/detail for `ADMIN` + `VIEWER`, or a consumer-oriented relevant feed for `VIEWER` without `ADMIN`. Features: `WEB.RESULTS_BROWSING`, `WEB.RESULTS_LIVE`, `WEB.VIEWER_RESULTS`.
- **Event Explorer** (`/events`) — bounded retained event history plus live SSE, filters, and event detail. Feature: `WEB.EVENT_EXPLORER`.
- **Processing Flow** (`/flows`) — backend-reconstructed run/item branches, evidence, durations, limitations, and stage metadata. Feature: `WEB.PROCESSING_FLOW`.

Cross-cutting accepted behavior includes deterministic browser verification, live-backend acceptance, targeted visual regression, accessibility hardening, responsive/large-data containment, route-level performance/runtime resilience, and the authentication/session role-aware shell foundation. ADMIN identity management and viewer-oriented Results are implemented but remain verification-pending in active sub-specifications.

## Sources

The Sources screen consumes the backend Source contract and supports:

- list configured Sources;
- create a Source;
- edit Source fields;
- enable or disable a Source;
- delete a Source;
- run a bounded diagnostic Test for a persisted Source.

The form exposes backend source-specific settings as a JSON string map.

Source Test is separate from normal pipeline state. The UI presents available backend-provided diagnostic fields such as status, HTTP response metadata, fetch/extraction duration, candidate count, failure text, and bounded item previews.

Disabled persisted Sources may be tested. A successful preview does not create a Collection Run or imply that preview items were published into Results.

## Monitoring Profiles

The Monitoring Profiles screen supports:

- create, edit, enable/disable, and delete;
- information category;
- collection interval in minutes;
- ordered Source membership;
- criteria as a JSON string map.

Existing Source order is preserved when other profile fields are edited. Newly selected Sources are appended to the membership order.

The UI shows Source enabled/disabled state for context, but backend scheduling/collection semantics remain authoritative.

Large Source/Profile collections remain fully rendered from the current backend response. Configuration tables use bounded local scrolling with sticky headers. The Source-membership editor uses a bounded native checkbox list instead of inventing frontend pagination or truncation.

Dedicated typed Analysis settings are not yet available in this frontend contract. They remain planned under `WEB.MONITORING_PROFILES` after the backend publishes the corresponding profile-owned contract and the frontend snapshot is synchronized.

## Collection Runs

Manual collection starts from a persisted Monitoring Profile.

The browser sends only `monitoringProfileId`. Information category and ordered Source membership come from backend profile configuration instead of being duplicated in the run form.

The screen lists recent durable runs and per-source/item terminal outcomes. Manual execution remains available independently of the profile's scheduled enabled state.

## Analysis Items

Analysis Items is a technical inspection surface for backend-exposed normalization/deduplication state.

It supports bounded reads with Monitoring Profile and Source filters. It is intentionally diagnostic; user-facing terminal analysis belongs to Results.

## Operational Results

The Results screen consumes the bounded Results REST API.

Current list filters are:

- Monitoring Profile;
- Source;
- information category;
- relevance;
- classification;
- analyzed time range.

The list uses the summary representation. Selecting one Result loads the detailed representation separately, including normalized content, attributes, tags, analysis metadata, and provenance.

The browser opens Results SSE before loading the durable REST snapshot. It waits for SSE `ready`, buffers later live updates during the snapshot request, and then merges snapshot/live state into TanStack Query. Connection/reconnect state is visible.

Long detail values remain contained through wrapping or local content scrolling on narrower layouts.

The operational Results presentation is rendered only when the principal has both explicit `ADMIN` and explicit `VIEWER`. Its detail includes internal provenance and diagnostic cross-navigation to Event Explorer and Processing Flow.

## Viewer Results

An explicit `VIEWER` principal without `ADMIN` uses a separate presentation component at the same `/results` route. It reuses the existing Results REST/detail/SSE contracts instead of introducing a duplicate backend API.

The viewer list always requests `relevant=true`. The first bounded filter set exposes information category and analyzed time bounds only. Monitoring Profile ID, Source ID, classification, event/correlation/trace identifiers, and other operational filters are not presented as viewer controls.

Selecting a viewer Result loads the same backend detail endpoint internally, but the rendered detail is limited to consumer-oriented content: title, category, source link, published/analyzed times, explanation, tags, normalized attributes, and normalized content. Profile/source/item identifiers, analyzer identity, event IDs, correlation/trace context, and links into Event Explorer or Processing Flow are intentionally not rendered.

Viewer live delivery reuses the accepted Results `useLiveList` flow. SSE carries `relevant=true` and SSE-supported filters; analyzed time bounds are applied to received live summaries in the browser because the current stream contract does not publish time-range parameters.

## Event Explorer

Event Explorer loads bounded retained technical history and follows new observed events through backend SSE.

Current filters include event type, producer, Kafka topic, correlation ID, Collection Run ID, item ID, and trace ID where supported by the backend contract.

Selected event detail exposes backend-provided Kafka position/key, trace/correlation context, producer/schema metadata, and decoded diagnostic payload.

This is a bounded backend projection, not direct Kafka history. Backend retention determines available history.

## Processing Flow

Processing Flow consumes the backend reconstruction API. The browser does not rebuild pipeline semantics from Event Explorer rows.

The screen supports:

- one Collection Run ID and an optional raw/normalized Item ID;
- one horizontal lane per backend `branchId`;
- stage status, evidence classification, and observed timestamps;
- transition kind and duration from backend edges;
- explicit reconstruction limitations;
- selected-stage event/item/profile/source/trace/outcome/score/Kafka metadata;
- drill-down from run flow to run-scoped item flow.

Collection Runs, Results, and Event Explorer deep-link into this view when they have the required identifiers. Flow stages link back to bounded Event Explorer and Results views.

Frontend-only `eventId` and `normalizedItemId` query parameters select matching rows after normal bounded snapshots load; they are not sent as unsupported backend filters.

Many run-level branches remain in backend-provided order inside a bounded vertical graph region. Each branch has its own horizontal stage-track scroll. Phone-sized layouts return branch scrolling to normal page flow to avoid nested vertical scroll traps.

## Dashboard

Dashboard combines small bounded reads from Sources, Monitoring Profiles, Collection Runs, and Analysis. It also reads Results when the current principal explicitly has `VIEWER`. An `ADMIN` principal without `VIEWER` does not call the Results boundary.

It is an operational overview rather than a separate backend aggregation contract. A dedicated backend summary endpoint should be introduced only if independent reads become inefficient or semantically inconsistent.

## API and contract integration

The checked-in backend REST snapshot is `openapi/signalharvester-v1.yaml`.

`openapi-typescript` generates `src/api/generated.ts`. Application-facing aliases live in `src/api/types.ts`. The browser `fetch` transport and common error handling live in `src/api/client.ts`.

The synchronized snapshot includes authentication/current-principal contracts, ADMIN identity-management contracts, Monitoring Profiles, Source Test, Results REST/SSE, Event Observation, and Processing Flow. The frontend consumes the authentication/current-principal contract, the ADMIN identity-management contract through `WEB.IDENTITY_ADMIN`, and the same Results contract for both operational and viewer-specific presentation. Frontend code consumes public boundaries only and never reads PostgreSQL or Kafka directly.

Feature: `WEB.CONTRACT_INTEGRATION`.


## Authentication and role-aware shell

The security foundation is implemented and accepted against the backend-owned cookie/CSRF contract.

`AuthSessionProvider` owns current-principal state through TanStack Query. Application bootstrap calls `GET /api/v1/auth/me`; a `401` produces anonymous state, while non-`401` bootstrap failures remain explicit and retryable.

`/login` posts username/password to `POST /api/v1/auth/login`, then re-reads `/api/v1/auth/me`. The frontend does not decode or persist the HttpOnly JWT. Passwords remain local form state and are cleared after successful authentication.

`src/api/client.ts` sends `credentials: 'include'` for REST. Unsafe requests other than login copy the readable `XSRF-TOKEN` cookie into `X-CSRF-TOKEN` when present. Results/Event Observation `EventSource` instances use `withCredentials: true` and do not place credentials in URLs.

Logout calls the backend through the same CSRF-protected adapter. Successful logout, logout `401`, or a protected application `401` clears the principal and removes non-auth TanStack Query data so another identity cannot inherit stale cached application state. A `403` keeps the current principal and remains visible as an authorization failure.

Role checks are additive presentation checks, not enforcement:

- explicit `ADMIN` exposes Dashboard, Sources, Monitoring Profiles, Collection Runs, Analysis Items, Event Explorer, and Processing Flow;
- the existing operational Results screen requires both explicit `ADMIN` and explicit `VIEWER` because it includes diagnostic/admin cross-navigation;
- `VIEWER` without `ADMIN` is authenticated and receives the consumer-oriented Results feed at `/results`;
- `USER` or `BOT` alone do not gain another role implicitly.

Admin/diagnostic Result links are hidden when `VIEWER` is absent. The backend remains authoritative and may still return `403` regardless of frontend presentation.

Features: `WEB.AUTH_SESSION`, `WEB.AUTHORIZATION_UX`, `WEB.CONTRACT_INTEGRATION`.

## Browser state

TanStack Query owns remote/server state, including the current principal, Sources, Monitoring Profiles, Collection Runs, Analysis items, Results, observed events, and reconstructed Processing Flows.

Page-local React state owns forms, filters, source-test presentation, current selections, and other transient interaction state. The application does not use a second global client-state library.

Feature: `WEB.SERVER_STATE`.

## Styling, accessibility, and responsive behavior

The application uses repository-owned CSS and small reusable presentation components. There is no third-party component framework.

Accepted browser hardening includes:

- a first-focusable skip link into the main content landmark;
- accessible names for representative forms/tables and repeated Source/Profile actions;
- Source/Profile edit focus entry and cancellation focus restoration;
- semantic loading/live status and request/validation alert behavior;
- keyboard-only selection in main tabular diagnostic screens;
- 320–390 px and tablet containment;
- bounded local scrolling for large configuration collections and many-branch flows;
- wrapping/containment for long Result and diagnostic values.

Features: `WEB.ACCESSIBILITY`, `WEB.RESPONSIVE_LAYOUT`, `WEB.ASYNC_FEEDBACK`.

## Route delivery

Primary feature screens are loaded through React lazy route imports.

`AppShell` remains visible while a route module loads. The main content area exposes accessible loading status, and route import/render failures are contained by a route-resetting error boundary with a full-page reload fallback.

Vite emits a production manifest. Repository tooling verifies that primary feature pages remain dynamic entries and reports raw/gzip JS/CSS sizes.

This capability is implemented and accepted; production verification protects the dynamic route structure and asset report.

Feature: `WEB.ROUTE_DELIVERY`.

## Verification

The canonical routine repository gate is `./run_checks.sh`. It:

1. regenerates OpenAPI TypeScript types;
2. typechecks application and browser-test code;
3. runs Vitest;
4. runs deterministic Playwright;
5. builds the production frontend;
6. verifies dynamic route entries and reports production assets.

The deterministic browser suite covers authentication bootstrap/login/logout, additive role isolation, CSRF request construction, credentialed EventSource creation, `401`/`403` behavior, ADMIN identity create/update and invariant-error handling, viewer vs operational Results separation, viewer-safe Result filters/detail presentation, core navigation/configuration, Source Test, Monitoring Profile and Collection Run request construction, Analysis filters, Results and Event Explorer REST/SSE behavior, Processing Flow, representative async states, accessibility interactions, SSE reconnect/resnapshot, stale bounded deep links, partial flow evidence, responsive/large-data containment, and delayed/failed lazy-route delivery.

`npm run e2e:visual` owns the focused non-updating comparison for the reviewed Results/detail golden. `npm run e2e:visual:update` is reserved for intentional reviewed baseline changes.

The opt-in `npm run e2e:live` workflow authenticates through the browser with an explicit `ADMIN` + `VIEWER` test identity, then owns a temporary RSS fixture, Source, and Monitoring Profile. It verifies real Results SSE, durable Analysis visibility, real Event Observation SSE, navigation into backend-reconstructed item/full-run Processing Flow, and authenticated CSRF-protected cleanup.

Accepted browser verification features: `WEB.BROWSER_VERIFICATION`, `WEB.VISUAL_REGRESSION`, `WEB.LIVE_BACKEND_ACCEPTANCE`.

## Current limitations

The frontend does not yet implement:

- dedicated typed Analysis-setting controls beyond the current criteria map;
- production-scale viewer Results search/pagination beyond the current bounded backend contract;
- final production frontend deployment integration.

The authentication/session role-aware shell and route-delivery capabilities are accepted. ADMIN identity management consumes the existing backend user-administration contract, and viewer-oriented Results reuse the existing Results REST/SSE boundary. Both newer slices are verification-pending. Backend authorization, identity invariants, and Result semantics remain authoritative regardless of frontend presentation.
