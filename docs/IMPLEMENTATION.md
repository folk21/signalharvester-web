---
type: Implementation Guide
title: Current implementation
description: Current implemented SignalHarvester Web screens, API usage, code organization, and known limitations.
---
# Current implementation

## Purpose

This document describes what the frontend currently implements. Active specifications describe intended changes and must not be read as evidence that a feature already exists.

The accepted baseline includes Monitoring Profiles, Source Test, profile-driven manual Collection Runs, live Results, Event Explorer, Processing Flow visualization, the resilience/edge-case browser suite, and real-backend diagnostic acceptance through Results/Event SSE and Processing Flow. Targeted visual regression is implemented as a small reviewed Results/detail baseline. The current branch adds focused accessibility hardening with native landmarks/status semantics, entity-specific repeated-action names, and explicit keyboard focus management for configuration forms.

## Current screens

| Screen | Route | Current capability | Backend boundary |
|---|---|---|---|
| Dashboard | `/` | Shows source/profile, collection, analysis, and recent Results summaries | Existing REST reads |
| Sources | `/sources` | Lists, creates, edits, enables/disables, deletes, and diagnostically tests sources | `/api/v1/sources`, `/api/v1/sources/{sourceId}/test` |
| Monitoring Profiles | `/profiles` | CRUD for persisted profiles, interval, source membership, criteria, and scheduled enabled state | `/api/v1/monitoring-profiles` |
| Collection Runs | `/runs` | Starts persisted profiles manually, lists recent runs, and inspects durable source outcomes | `/api/v1/admin/collection-runs` |
| Analysis Items | `/analysis` | Inspects normalized/deduplication state with profile/source filters | `/api/v1/admin/analysis/items` |
| Results | `/results` | Lists analyzed Results, loads detail on selection, and merges live SSE updates with durable REST snapshots | `/api/v1/results`, `/api/v1/results/stream` |
| Event Explorer | `/events` | Shows bounded technical event history and live observed events with diagnostic filters/detail | `/api/v1/events`, `/api/v1/events/stream` |
| Processing Flow | `/flows` | Visualizes reconstructed run/item branches, stage evidence, durations, limitations, and stage metadata | `/api/v1/flows/collection-runs/{collectionRunId}`, `/api/v1/flows/collection-runs/{collectionRunId}/items/{itemId}` |

The application shell remains one coherent operational/product frontend.

## Sources

The Sources screen supports the backend source CRUD contract:

- list configured sources;
- create a source;
- edit a source;
- enable or disable a source by updating its configuration;
- delete a source.

The form exposes the backend source-specific settings map as JSON.

Persisted sources also expose a `Test` action. The diagnostic response is rendered separately from normal pipeline state and includes available backend-provided information such as:

- diagnostic status;
- HTTP status and response metadata;
- fetch and extraction duration;
- extracted candidate count;
- failure text;
- bounded item previews.

Disabled persisted sources may be tested. Source Test does not create a Collection Run or imply that preview items were published into Results.

## Monitoring Profiles

The Monitoring Profiles screen consumes the persisted backend profile contract.

It supports:

- create, edit, enable/disable, and delete;
- information category;
- collection interval in minutes;
- ordered source membership;
- criteria as a JSON string map.

Existing profile source order is preserved when the user edits other profile fields without changing membership. Newly selected sources are appended to the membership order.

The UI presents source enabled/disabled state for context, but the backend remains authoritative for scheduling and collection semantics.

## Collection Runs

The Collection Runs screen starts manual collection by selecting a persisted Monitoring Profile.

The request contains only `monitoringProfileId`. Information category and ordered source membership come from backend profile configuration; the browser no longer asks the user to duplicate that state in the run form.

The screen also lists recent durable runs and per-source/item terminal outcomes. Manual execution remains available independently of the profile's scheduled enabled state.

## Analysis Items

The Analysis Items screen exposes the backend operational inspection API for durable normalization/deduplication state.

This screen is primarily diagnostic. User-facing terminal analyzed state belongs to Results.

## Results

The Results screen uses the bounded Results REST API.

The list supports current backend filters for:

- monitoring profile;
- source;
- information category;
- relevance;
- classification;
- analyzed time range.

The list intentionally uses the summary representation and does not request full normalized content for every row. Selecting one result loads its detail separately and shows content, attributes, tags, analysis metadata, and provenance.

Results SSE supplements the durable REST snapshot. The browser establishes SSE first, waits for `ready`, loads the REST snapshot while buffering live updates, then merges both into the TanStack Query cache. Connection/reconnect state is visible.


## Processing Flow

The Processing Flow screen consumes the backend reconstruction API. The browser does not rebuild pipeline semantics from Event Explorer rows.

The screen supports:

- one Collection Run ID and an optional raw/normalized Item ID;
- one horizontal lane per backend `branchId`;
- stage status, evidence classification, and observed timestamps;
- transition kind and duration from backend edges;
- explicit backend limitations such as partial retained history or unobserved Results persistence;
- selected-stage detail with event, item, profile/source, trace, outcome, score, and Kafka metadata;
- drill-down from run flow to run-scoped item flow.

Collection Runs, Results, and Event Explorer deep-link into this view when they have the required identifiers. Flow stages link back to bounded Event Explorer and Results views. Frontend-only `eventId` and `normalizedItemId` query parameters select a matching row after its normal bounded snapshot is loaded; they are not sent as unsupported backend filters.

## Dashboard

The Dashboard combines small recent reads from Sources, Monitoring Profiles, Collection Runs, Analysis, and Results.

It is an operational overview rather than a separate backend aggregation contract. Dashboard queries should remain bounded; a dedicated backend summary endpoint should be introduced only if independent reads become inefficient or semantically inconsistent.

## API implementation

The frontend REST boundary is `src/api/client.ts`.

The current application uses the browser `fetch` API and converts non-success responses into a shared `ApiError`. REST schema types come from the checked-in OpenAPI document through `openapi-typescript`.

The checked-in OpenAPI snapshot includes Monitoring Profiles, Source Test, Results SSE, Event Observation, and processing-flow contracts. The frontend consumes the configuration/run REST APIs, Results and Event Observation REST/SSE contracts, and the processing-flow REST read model.

No frontend code reads PostgreSQL or Kafka directly.

## Client state

TanStack Query owns remote/server state, including sources, monitoring profiles, runs, analysis items, Results, observed events, and reconstructed processing flows.

Page-local React state owns forms, filters, source-test presentation, and current selections. The application does not use a second global client-state library.

## Styling

The application uses one repository-owned global stylesheet and small reusable presentation components. There is no third-party component framework.

## Current verification

The repository's canonical routine verification is `./run_checks.sh`. It regenerates the checked-in API types, typechecks application and browser-test code, runs Vitest, runs deterministic Playwright browser tests, and builds the production frontend. `npm run e2e:visual` is the focused non-updating comparison for the reviewed Results/detail golden, while `npm run e2e:visual:update` is reserved for intentional baseline changes.

The deterministic browser suite now covers:

- application-shell navigation including Monitoring Profiles, Event Explorer, and Processing Flow;
- a reviewed golden screenshot for the populated Results/detail composition at a fixed high-DPI viewport;
- Sources create behavior and Source Test diagnostics;
- Monitoring Profile create request construction and source membership;
- profile-driven manual Collection Run request/detail behavior;
- Analysis filters;
- Results filters/detail and live SSE merge behavior;
- Event Explorer history/live behavior;
- Processing Flow run/item visualization and drill-down;
- representative loading/error/empty states;
- keyboard-only selection in the main tabular diagnostic screens;
- a first-focusable skip link into the main content landmark;
- named representative forms/tables and entity-specific Source/Profile row actions;
- Source/Profile edit focus entry and cancellation focus restoration;
- semantic loading/live status and request/validation alert behavior;
- SSE reconnect/resnapshot behavior without duplicate logical rows;
- stale deep links against bounded Result/Event snapshots;
- partial Processing Flow evidence and retained-history limitations;
- long diagnostic identifiers on a narrow mobile viewport without page-level horizontal overflow.

The opt-in live Playwright workflow owns a temporary RSS source and monitoring profile and uses two manual Collection Runs. Before the first run, a profile/source-filtered Results page establishes the real SSE stream and must receive both fixture Results without manual refresh. Before the second run, Event Explorer establishes the real Event Observation SSE stream and must receive a newly correlated event without refresh. The workflow then selects a real Analysis event, opens its backend-reconstructed item flow, and expands to the full run flow. Analysis inspection remains a bounded durable-state check. Cleanup still removes the profile before the source so backend referential integrity is respected.

Monitoring Profiles / Source Test, live Results / Event Explorer, and Processing Flow were accepted on 2026-09-14. UI resilience and edge-case verification was accepted on 2026-09-15 after the routine checks passed. Live diagnostic acceptance was accepted on 2026-09-15 after both the routine gate and `npm run e2e:live` passed in the developer environment. Targeted visual regression remains verification-pending until its golden comparison is accepted in the developer environment. The current accessibility-hardening implementation remains verification-pending until the routine gate passes.

## Current limitations

The following product capabilities are not implemented in the frontend:

- dedicated analysis-setting configuration beyond the current profile criteria map;
- authentication and authorization.

Backend contracts used by the current configuration, live diagnostics, and flow visualization are available. Remaining limitations are product/security work rather than blockers in these diagnostic contracts.
