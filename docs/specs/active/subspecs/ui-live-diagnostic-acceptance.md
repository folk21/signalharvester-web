---
type: Specification
title: Live backend diagnostic acceptance
description: Extend the opt-in real-backend Playwright workflow through Results SSE, Event Observation SSE, and backend-reconstructed Processing Flow diagnostics.
document_role: subspec
spec_status: verification-pending
parent: ../spec-signal-harvester-web.md
---
# Live backend diagnostic acceptance

## Status

Implementation complete. Live developer verification pending.

## Goal

Strengthen cross-project browser acceptance by exercising the already implemented diagnostic contracts against a separately running real backend and deterministic local RSS data.

The live test should prove browser-visible integration at the REST/SSE boundary. It must not duplicate backend assertions about Kafka offsets, database rows, deduplication transactions, or reconstruction internals.

## Relationship to the backend product specification

This slice verifies the browser side of the backend platform umbrella requirements for the live result feed, live technical Event Explorer, and visual processing-flow inspection. The backend remains authoritative for the corresponding REST/SSE contracts and reconstruction semantics; this frontend spec only defines how the real browser acceptance path exercises those published boundaries.

## Scenario

The existing temporary RSS source and Monitoring Profile remain the fixture boundary.

The expanded workflow uses two manual Collection Runs:

1. Open a profile/source-filtered Results page and wait for its real SSE stream to report `Live` while the feed is still empty.
2. Start the first Collection Run from the browser.
3. Verify both fixture Results appear without pressing `Refresh`, then inspect one Result detail and its run/source/profile provenance.
4. Retain the existing Analysis inspection check as a bounded durable-state assertion.
5. Open Event Explorer, filter to collection-produced events, and wait for its real SSE stream to report `Live`.
6. Start the second Collection Run from the browser.
7. Verify an observed event correlated to that run appears without refreshing Event Explorer.
8. Narrow Event Explorer to the second run's Analysis events, select one observed event, and navigate through its `Open processing flow` action.
9. Verify the backend-reconstructed item flow reaches the terminal event and exposes expected pipeline stages.
10. Navigate from the item flow to the full Collection Run flow and verify both RSS item branches are present.

The second run intentionally reuses the same deterministic feed. The browser test does not assert the backend's duplicate-decision semantics; it only requires that the real pipeline produces an Analysis event that the diagnostic contracts can observe and reconstruct.

## Requirements

### R1 — Results SSE is verified against the real backend

The Results page must establish its SSE stream before collection begins. Fixture Results must become visible without a manual refresh or polling action on that page.

### R2 — Event Observation SSE is verified against the real backend

Event Explorer must establish its SSE stream before the second run begins. At least one event correlated to that new run must appear while the page remains open and without invoking `Refresh`.

### R3 — Processing Flow remains backend-owned

The live browser test must navigate through the existing Processing Flow UI and assert only backend-returned browser-visible state. It must not reconstruct nodes or edges in test code.

The acceptance path must cover both a run-scoped item flow and the corresponding full Collection Run flow.

### R4 — deterministic and bounded execution

The test must continue using the temporary local two-entry RSS fixture and one temporary source/profile pair. It must not depend on a public website.

The additional diagnostic checks must stay in the existing opt-in `e2e:live` suite rather than entering routine `./run_checks.sh`.

### R5 — cleanup preserves backend integrity

The temporary Monitoring Profile must be removed before its Source. Cleanup should still run on test failure whenever the corresponding identifiers were created successfully.

## Non-goals

This slice does not:

- assert Kafka partitions, offsets, consumer commits, or persistence rows directly;
- reproduce backend deduplication or Processing Flow reconstruction rules in Playwright;
- make the routine deterministic suite depend on a running backend;
- add public-network fixture dependencies;
- add new REST/SSE contracts or frontend dependencies.

## Acceptance criteria

This slice is accepted when:

- the live Playwright workflow opens Results SSE before the first run and receives both fixture Results without manual refresh;
- Event Explorer SSE is open before the second run and receives a newly correlated event without manual refresh;
- the selected real observed event opens a run-scoped item Processing Flow;
- the item flow reaches a terminal event and exposes real reconstructed pipeline stages;
- the full run flow contains both deterministic RSS item branches;
- source/profile cleanup still respects backend referential integrity;
- `./run_checks.sh` passes;
- `npm run e2e:live` passes against the current separately running backend.
