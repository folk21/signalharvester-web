---
type: Specification
title: SignalHarvester Web initial product specification
description: Active frontend umbrella specification for configuration, operational inspection, Results, live updates, and event-flow diagnostics.
document_role: umbrella
spec_status: active
current_focus: subspecs/ui-browser-verification.md
---
# SignalHarvester Web initial product specification

## Status

Active specification — frontend product target and browser behavior.

This specification refines the browser-facing requirements from the SignalHarvester platform umbrella. The backend repository remains authoritative for REST/OpenAPI, SSE payload contracts, persistence behavior, Kafka/event semantics, and backend business rules.

Frontend implementation details belong here rather than in the backend repository.

## Current implementation focus

The current focus is browser verification under [`subspecs/ui-browser-verification.md`](subspecs/ui-browser-verification.md).

The existing frontend already provides Dashboard, Sources CRUD, manual Collection Run operation/inspection, Analysis inspection, and Results list/filter/detail against the current backend REST contract. The next increment should make those workflows reproducibly verifiable in a real browser before larger UI capabilities are added.

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

## Current-state coverage

| Capability | State |
|---|---|
| Dashboard | Implemented |
| Source CRUD | Implemented |
| Manual Collection Runs | Implemented |
| Collection Run inspection | Implemented |
| Analysis inspection | Implemented |
| Results list/filter/detail | Implemented |
| Browser automation | Planned current focus |
| Monitoring profiles and schedules | Pending backend + UI |
| Source test/preview | Pending backend + UI |
| Live Results via SSE | Pending backend + UI |
| Event Explorer | Pending backend + UI |
| Processing-flow visualization | Pending backend + UI |
| Authentication/authorization | Pending |

## Requirements

### UI-R1 — one coherent application shell

The product must provide one consistent application shell and navigation model for configuration, operations, Results, and diagnostic screens.

Adding future product-oriented screens must not require a separate frontend repository or duplicate application shell without a concrete lifecycle reason.

### UI-R2 — backend contract fidelity

REST request and response types must come from the backend OpenAPI contract.

The frontend must not maintain hand-written duplicate DTO definitions for existing OpenAPI schemas. Contract updates must be reproducible through the repository's generation command and must pass TypeScript validation.

Future SSE payloads must also have explicit backend-owned contracts before the frontend depends on them.

### UI-R3 — source configuration

The UI must allow the user to:

- list configured sources;
- create a source;
- edit a source;
- enable or disable a source;
- delete a source.

Known client-side input errors should be reported before submission where practical. Backend validation remains authoritative.

Current status: implemented for the existing source REST contract.

### UI-R4 — source validation and preview

When the backend source-test capability exists, the UI must allow a source configuration to be tested without silently inserting test data into the normal Results feed.

The UI should present available diagnostic information such as:

- request success/failure;
- HTTP status;
- fetch/parsing duration;
- candidate item count;
- a bounded extracted-item preview;
- parsing/validation errors.

Current status: blocked on backend contract.

### UI-R5 — monitoring profile configuration

When the backend monitoring-profile contract exists, the UI must support:

- profile CRUD;
- information category;
- enabled/disabled state;
- associated sources;
- collection schedule or interval;
- search/matching criteria;
- analysis settings required by the first product slice.

The UI must make profile/source relationships understandable and editable without process restart or redeployment.

Current status: blocked on backend persistence/API work.

### UI-R6 — collection operations and run inspection

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

The UI must provide a bounded technical view of backend-exposed normalized/deduplication state for diagnosis.

This view must not pretend to be the user-facing terminal result model.

Current status: implemented.

### UI-R8 — Results browsing and detail

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

When backend SSE is available, an already-open Results view must receive newly available Results without manual refresh.

The UI must:

- reconnect after transient connection loss;
- keep durable REST reads as the recovery/source-of-truth boundary;
- avoid direct Kafka access;
- make connection failure visible when it affects freshness.

Current status: pending backend SSE.

### UI-R10 — live technical Event Explorer

When the event-observation backend exists, the UI must provide a bounded live diagnostic view of processing events.

Filters should include backend-supported dimensions such as:

- event type;
- producer/service;
- Kafka topic;
- correlation identifier;
- Collection Run;
- content item.

The browser must not expose or emulate unlimited Kafka history.

Current status: pending backend event-observation APIs.

### UI-R11 — visual processing-flow inspection

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

Current status: pending backend event-observation/correlation support.

### UI-R12 — explicit async states

Every data-driven screen must handle:

- loading;
- failure;
- successful empty state;
- successful populated state.

Mutations must provide enough feedback to distinguish successful persistence from failed submission.

### UI-R13 — server-state ownership

Remote state must remain owned by a server-state mechanism such as TanStack Query. Local component state should be used for transient browser interaction.

Do not introduce a second global cache/store for backend data without a concrete requirement.

### UI-R14 — deterministic browser verification

Core browser workflows must have automated coverage that validates frontend behavior without reproducing backend business tests.

The verification strategy must include:

- controlled REST-response tests for browser behavior;
- at least one opt-in live E2E path against a real separately running backend;
- no mandatory dependency on public internet sources for deterministic acceptance.

The active browser-verification sub-spec defines this increment.

### UI-R15 — independent delivery boundary

The frontend must remain independently buildable and deployable from the backend.

Development may use a Vite reverse proxy. Separately hosted builds must use an explicit backend origin and a compatible backend CORS/security policy.

### UI-R16 — trusted-environment security until hardened

Until authentication and authorization are implemented, the application must clearly remain a trusted-environment tool.

The current build must not be documented as internet-safe.

A later security slice must define authentication, authorization, cross-origin policy, and operational action protection before public/shared deployment.

### UI-R17 — accessibility and usability baseline

Core workflows must remain keyboard-operable and understandable without relying only on color.

Interactive controls must use appropriate semantic HTML and labels. Browser automation should include basic checks for critical navigation and form accessibility where practical.

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
