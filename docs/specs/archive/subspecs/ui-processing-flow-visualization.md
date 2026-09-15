---
type: Specification
title: Processing-flow visualization UI
description: Visualize backend-reconstructed collection-run and item processing graphs with explicit evidence and diagnostic navigation.
document_role: subspec
spec_status: completed
parent: ../spec-signal-harvester-web.md
---
# Processing-flow visualization UI

## Status

Completed and accepted after repository verification.

## Goal

Expose the backend processing-flow reconstruction as a bounded diagnostic browser view.

The frontend must visualize the graph returned by the backend. It must not independently infer processing stages, invent missing evidence, or treat the view as a replacement for distributed tracing.

## Backend contracts

This slice consumes the existing backend-owned endpoints:

- `GET /api/v1/flows/collection-runs/{collectionRunId}`;
- `GET /api/v1/flows/collection-runs/{collectionRunId}/items/{itemId}`.

The frontend must use the OpenAPI-derived `ProcessingFlow`, `ProcessingFlowNode`, and `ProcessingFlowEdge` types.

## Flow selection

Add `/flows` to the application shell.

The screen must support:

- one required Collection Run ID;
- one optional raw or normalized Item ID;
- run-level reconstruction when only the Collection Run ID is present;
- item-level reconstruction when both identifiers are present;
- URL query parameters so diagnostic links can be copied and shared.

Item inspection must remain scoped by Collection Run ID. The frontend must not merge equal logical item identifiers from different runs.

## Visualization

Render one processing lane for each backend `branchId`.

Within each branch, show backend-returned stages in processing order. Current stages may include:

- External source;
- Collection;
- Raw Kafka;
- Normalization;
- Deduplication;
- Analysis;
- Terminal Kafka;
- Results persistence.

Each visible stage must show:

- stage name;
- backend status;
- evidence classification;
- timestamp when available.

Transitions should show backend edge kind and duration when available.

The visualization must remain understandable without color. Status, evidence, edge kind, and limitations must remain visible as text.

Horizontal scrolling is acceptable for the complete stage path on narrow viewports. The detail surface must remain usable without requiring a graph library.

## Evidence and limitations

The browser must preserve the backend distinction between:

- `OBSERVED_EVENT`;
- `OBSERVED_KAFKA_METADATA`;
- `DERIVED_FROM_EVENT`;
- `NOT_OBSERVED`.

`NOT_OBSERVED`, partial history, and backend reconstruction limitations must remain explicit. The UI must not visually imply that an unobserved stage was proven to occur.

Flow-level limitations such as retained-history gaps or unobserved Results persistence must be displayed when returned by the backend.

## Stage detail

Selecting a stage must show available backend metadata, including where present:

- event and producer identity;
- event/source-event identity;
- raw and normalized item identity;
- monitoring profile and source identity;
- outcome and score;
- trace context;
- Kafka topic, partition, offset, and key.

The detail surface should link to related bounded diagnostics when identifiers permit:

- Event Explorer;
- Results;
- item-scoped flow from a run-scoped graph.

## Cross-screen navigation

Existing diagnostic surfaces should link into Processing Flow when they already possess the required identities:

- Collection Run detail -> run flow;
- Collection Run source outcome -> item flow when `rawItemId` exists;
- Result detail -> item flow using correlation/run and normalized item identity;
- Event detail -> run/item flow.

Event Explorer may use a frontend-only `eventId` query parameter to select one event after its bounded history snapshot loads. Results may use a frontend-only `normalizedItemId` query parameter to select the matching row from the bounded filtered snapshot.

These frontend query parameters must not be sent as unsupported backend filters.

## State ownership

TanStack Query owns fetched `ProcessingFlow` state.

Local React state may own:

- unapplied run/item query fields;
- selected stage identity.

No graph-specific global store is required.

## Verification

Vitest must cover deterministic branch/stage ordering and duration formatting.

Deterministic Playwright coverage must verify that:

- Processing Flow is reachable from the application shell;
- a run flow renders stage/status/evidence information;
- edge kind and duration are visible;
- stage detail exposes event metadata;
- a run branch can drill into the run-scoped item endpoint;
- diagnostic links are present where backend identifiers allow them.

The deterministic suite must use controlled REST responses and must not reproduce backend reconstruction algorithms.

## Non-goals

This slice does not:

- reconstruct graphs in the browser;
- replace OpenTelemetry or distributed tracing;
- add an external graph-layout dependency;
- add unlimited event/history access;
- change backend flow semantics or wire contracts.

## Acceptance criteria

This slice is accepted when:

- run and item processing flows are visually inspectable;
- evidence and backend limitations remain explicit;
- stage metadata and durations are usable for diagnosis;
- Results, Events, Runs, and Flow form one navigable diagnostic surface;
- deterministic browser coverage protects the flow UI;
- `./run_checks.sh` passes;
- current-state documentation describes Processing Flow as implemented.
