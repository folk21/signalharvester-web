---
type: Feature Catalog
title: SignalHarvester Web feature vocabulary
description: Stable frontend feature identifiers with cross-references to related SignalHarvester backend capabilities.
---
# SignalHarvester Web feature vocabulary

## Purpose

This document owns the stable feature IDs used across SignalHarvester Web documentation, active specifications, tests, and important implementation entry points.

A frontend feature ID names a durable browser capability. It does not name a requirement or a specification lifecycle stage.

Keep these concepts separate:

- **Frontend feature ID** — a long-lived browser capability, for example `WEB.RESULTS_LIVE`.
- **Backend feature ID** — the related backend capability from the backend repository's `docs/FEATURES.md`, for example `RESULTS.LIVE`.
- **Requirement ID** — a normative rule inside one frontend specification, for example `UI-R9` or `R3`.
- **Specification** — one planned or in-progress frontend change, for example `ui-performance-runtime-resilience`.

A frontend feature may be implemented or refined by several specifications. Archiving a specification does not retire its feature IDs.

Related backend IDs are navigation links between repositories. They do not transfer ownership to the frontend and do not imply that frontend authorization or business logic replaces backend enforcement.

## Identifier format

Frontend feature IDs use uppercase ASCII words under the `WEB` namespace.

- Use `.` between capability levels: `WEB.RESULTS_LIVE`.
- Use `_` inside a multi-word level: `WEB.MONITORING_PROFILES`.
- Prefer two levels after `WEB` only when a third level materially improves navigation.
- Do not encode dates, versions, requirement numbers, implementation stages, React component names, routes, or deployment topology.
- Once an ID is referenced outside this catalog, keep it stable. Rename it only through an explicit repository-wide vocabulary migration.

The dot is a naming hierarchy only. It does not define authorization, inheritance, or ownership between frontend and backend features.

## Usage rules

Use frontend feature IDs when they improve navigation or clarify capability ownership.

Useful locations include:

- umbrella and sub-spec feature-scope sections;
- requirement cross-references;
- owning architecture or implementation documentation;
- important screen/API integration boundaries;
- feature-level browser tests.

Do not tag every component, helper, generated type, or CSS rule. Avoid metadata noise.

Tests and documents must use IDs from this catalog. Do not invent local feature codes.

Current implementation state belongs in `docs/IMPLEMENTATION.md` and `docs/ROADMAP.md`, not in this catalog.

## Catalog

### Application and contract boundary

- `WEB.APP_SHELL` — one coherent application shell, navigation model, route composition, and shared page layout. Related backend feature IDs: `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.
- `WEB.CONTRACT_INTEGRATION` — checked-in backend OpenAPI consumption, generated TypeScript schemas, REST adapter behavior, and explicit SSE integration boundaries. Related backend feature IDs: `CONTRACTS.HTTP`, `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.
- `WEB.SERVER_STATE` — TanStack Query ownership of backend state and cache integration for REST/SSE data. Related backend feature IDs: `CONTRACTS.HTTP`, `RESULTS.LIVE`, `DIAGNOSTICS.EVENT_OBSERVATION`.
- `WEB.ASYNC_FEEDBACK` — explicit loading, failure, empty, populated, mutation, and live-connection browser states. Related backend feature IDs: `CONTRACTS.HTTP`, `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.

### Configuration and operations

- `WEB.DASHBOARD` — operational overview across current Sources, Monitoring Profiles, Collection Runs, Analysis inspection, and Results reads. Related backend feature IDs: `CONFIGURATION.SOURCES`, `CONFIGURATION.MONITORING_PROFILES`, `COLLECTION.RUNS`, `DIAGNOSTICS.ANALYSIS_INSPECTION`, `RESULTS.BROWSING`.
- `WEB.SOURCE_CONFIGURATION` — browser CRUD and enabled-state workflows for persisted Sources. Related backend feature IDs: `CONFIGURATION.SOURCES`, `SECURITY.EXTERNAL_SOURCE_ACCESS`.
- `WEB.SOURCE_TEST` — bounded persisted-source diagnostic test and extracted-item preview. Related backend feature IDs: `COLLECTION.SOURCE_TEST`, `SECURITY.EXTERNAL_SOURCE_ACCESS`.
- `WEB.MONITORING_PROFILES` — browser CRUD for Monitoring Profiles, ordered source membership, collection interval, criteria, and profile-owned analysis settings when published by the backend. Related backend feature IDs: `CONFIGURATION.MONITORING_PROFILES`, `COLLECTION.SCHEDULING`, `ANALYSIS.CLASSIFICATION`.
- `WEB.COLLECTION_RUNS` — profile-driven manual Collection Run execution and durable run/source outcome inspection. Related backend feature IDs: `COLLECTION.RUNS`, `DATA.PROVENANCE`.

### Results and diagnostics

- `WEB.ANALYSIS_INSPECTION` — bounded technical inspection of normalized/deduplication state. Related backend feature IDs: `DIAGNOSTICS.ANALYSIS_INSPECTION`, `ANALYSIS.NORMALIZATION`, `ANALYSIS.DEDUPLICATION`.
- `WEB.RESULTS_BROWSING` — analyzed Result list/filter/detail presentation and provenance navigation. Related backend feature IDs: `RESULTS.BROWSING`, `RESULTS.MATERIALIZATION`, `DATA.PROVENANCE`.
- `WEB.RESULTS_LIVE` — race-free live Result updates over backend SSE merged with durable REST state. Related backend feature IDs: `RESULTS.LIVE`, `CONTRACTS.HTTP`.
- `WEB.EVENT_EXPLORER` — bounded technical event history, live updates, filtering, detail, and diagnostic navigation. Related backend feature IDs: `DIAGNOSTICS.EVENT_OBSERVATION`, `EVENTING.CORRELATION`.
- `WEB.PROCESSING_FLOW` — read-only visualization of backend-reconstructed Collection Run/item processing graphs. Related backend feature IDs: `DIAGNOSTICS.PROCESSING_FLOW`, `EVENTING.CORRELATION`, `DATA.PROVENANCE`.

### User experience and delivery

- `WEB.ACCESSIBILITY` — keyboard-operable navigation and inspection, semantic status/error behavior, accessible names, and focus management across core workflows. Related backend feature IDs: `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.
- `WEB.RESPONSIVE_LAYOUT` — phone/tablet containment and large bounded dataset presentation without inventing backend pagination semantics. Related backend feature IDs: `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.
- `WEB.ROUTE_DELIVERY` — route-level code splitting, explicit lazy-route loading, runtime failure containment, and reproducible production asset structure. Related backend feature IDs: `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.

### Security and role-specific presentation

- `WEB.AUTH_SESSION` — browser authentication/session lifecycle over backend identity/authentication contracts, including credentialed requests and authentication failure handling. Related backend feature IDs: `SECURITY.IDENTITY_ROLES`, `SECURITY.AUTHENTICATION`.
- `WEB.AUTHORIZATION_UX` — role-aware navigation and presentation while preserving backend authorization as the enforcement boundary. Related backend feature IDs: `SECURITY.IDENTITY_ROLES`, `SECURITY.AUTHORIZATION`.
- `WEB.IDENTITY_ADMIN` — ADMIN-oriented identity management workflows over backend security administration APIs. Related backend feature IDs: `SECURITY.IDENTITY_ROLES`, `SECURITY.AUTHORIZATION`.
- `WEB.VIEWER_RESULTS` — consumer-facing Results experience that hides internal operational detail inappropriate for viewer workflows. Related backend feature IDs: `PRESENTATION.VIEWER_RESULTS`, `RESULTS.BROWSING`, `SECURITY.AUTHORIZATION`.

### Verification

- `WEB.BROWSER_VERIFICATION` — deterministic backend-independent browser verification for core workflows and request boundaries. Related backend feature IDs: `TESTING.DETERMINISTIC_LOCAL`, `CONTRACTS.HTTP`.
- `WEB.VISUAL_REGRESSION` — reviewed targeted visual regression for stable dense UI compositions. Related backend feature IDs: `TESTING.DETERMINISTIC_LOCAL`.
- `WEB.LIVE_BACKEND_ACCEPTANCE` — bounded opt-in browser acceptance against a real backend and deterministic local fixture data. Related backend feature IDs: `TESTING.DETERMINISTIC_LOCAL`, `DELIVERY.FRONTEND_BACKEND_BOUNDARY`.

## Adding a frontend feature ID

Add an ID only when the browser capability should remain meaningful beyond one patch or specification.

Before adding an ID:

1. Check this catalog for an existing capability with the same meaning.
2. Name the durable browser capability, not the current component, route, test file, or implementation stage.
3. Check the backend feature catalog and record related backend feature IDs when the capability consumes or presents them.
4. Add the frontend ID here first.
5. Reference it from the owning active specification or current-state document.
6. Keep requirement wording and specification lifecycle independent from the feature name.
