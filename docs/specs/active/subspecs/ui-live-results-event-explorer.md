---
type: Specification
title: Live Results and Event Explorer UI
description: Add race-free Results SSE updates and bounded technical Event Explorer history/live delivery.
document_role: subspec
spec_status: verification-pending
parent: ../spec-signal-harvester-web.md
---
# Live Results and Event Explorer UI

## Status

Implementation complete. Verification pending.

## Goal

Connect the existing Results screen and a new Event Explorer to the backend-owned SSE contracts without introducing a second frontend server-state store.

Processing-flow visualization is intentionally deferred to the next bounded frontend slice.

## Live-data contract

Both live screens must use the backend-defined race-free bootstrap sequence:

1. establish the SSE connection;
2. receive the `ready` event;
3. fetch the durable REST snapshot;
4. buffer live data events while the snapshot request is in flight;
5. merge the snapshot and buffer by logical identity;
6. apply later SSE updates to the same TanStack Query cache.

If SSE fails before `ready`, the UI must still load the REST snapshot and make degraded live freshness visible. Native `EventSource` reconnection remains responsible for `Last-Event-ID` resume behavior.

## Results

The existing Results screen must:

- consume `GET /api/v1/results/stream`;
- keep `GET /api/v1/results` as the durable snapshot boundary;
- apply backend-supported stream filters;
- apply analyzed-time filters client-side to incoming Result updates because those filters are REST-only;
- show live/reconnecting state;
- allow manual durable snapshot refresh;
- link Result provenance into Event Explorer using collection-run/correlation and item identity.

## Event Explorer

Add `/events` to the existing application shell.

The screen must:

- fetch bounded history from `GET /api/v1/events`;
- consume `GET /api/v1/events/stream`;
- support event type, producer, topic, correlation, Collection Run, item, and trace filters;
- show event identity, timestamps, producer, Kafka metadata, correlation/trace context, and decoded payload diagnostics;
- remain explicitly bounded by backend retention rather than pretending to expose Kafka history;
- link back to Results when the observed payload contains suitable Result identity context.

## State ownership

TanStack Query owns REST snapshots and live merged lists. The SSE layer only coordinates connection state, bootstrap buffering, and updates to Query cache.

Do not add Redux, Zustand, or another global server-state cache for this slice.

## Verification

Vitest must cover deterministic live/snapshot merge behavior.

Deterministic Playwright coverage must verify that:

- a REST snapshot is not requested before SSE `ready` in the normal bootstrap path;
- a live Result appears without manual Refresh;
- Event Explorer loads its snapshot after `ready`;
- a live observed event appears without polling;
- event detail exposes technical Kafka/event metadata.

The deterministic suite may replace browser `EventSource`; it must not require a real backend or infinite mocked HTTP response.

## Acceptance criteria

This slice is accepted when:

- Results live updates use the backend SSE contract;
- Event Explorer history and live updates are usable;
- degraded/reconnecting state is visible;
- navigation between Result provenance and technical events works;
- `./run_checks.sh` passes;
- current-state documentation describes live Results and Event Explorer as implemented;
- processing-flow visualization remains the explicit next frontend slice.
