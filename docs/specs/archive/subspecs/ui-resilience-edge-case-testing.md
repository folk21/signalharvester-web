---
type: Specification
title: UI resilience and edge-case verification
description: Strengthen deterministic browser verification around keyboard access, live reconnect recovery, bounded history, partial diagnostic data, and narrow layouts.
document_role: subspec
spec_status: completed
parent: ../spec-signal-harvester-web.md
---
# UI resilience and edge-case verification

## Status

Completed and accepted on 2026-09-15 after the routine frontend verification passed.

## Goal

Protect the current frontend against common browser/UI failure modes that are easy to miss during happy-path visual inspection.

This slice strengthens deterministic Playwright coverage. It may make small production changes when a new edge-case test exposes an actual browser usability defect, but it does not add new backend contracts or product capabilities.

## Keyboard interaction

The primary tabular inspection screens must allow a keyboard-only user to select one row and open its detail surface without requiring pointer input.

Cover:

- Collection Runs;
- Analysis Items;
- Results;
- Event Explorer.

Selection controls must use native interactive elements with visible focus treatment. Do not convert native table rows into fake buttons when a real button can preserve table semantics.

## Live reconnect recovery

Deterministic SSE coverage must verify that Results can:

1. load the durable snapshot after `ready`;
2. apply a live replacement for an existing logical Result without creating a duplicate row;
3. expose reconnecting state after an SSE error;
4. resynchronize from REST after the stream becomes ready again;
5. keep one row for one logical Result after recovery.

The browser test must not reproduce backend cursor semantics. The backend remains authoritative for SSE ordering and `Last-Event-ID` behavior.

## Bounded history and stale deep links

Frontend-only selection hints may refer to a Result or observed Event that is no longer present in the bounded REST snapshot.

The UI must remain usable when this happens:

- the retained list still renders;
- no unrelated row is selected automatically;
- the detail panel remains in its explicit no-selection state;
- no extra unsupported backend request is invented to recover the missing row.

## Partial processing flows

Processing Flow verification must include a backend response with partial history and missing evidence.

The UI must preserve and display backend-provided limitations and `NOT_OBSERVED` evidence rather than visually upgrading those stages to successful observations.

## Narrow viewport and long diagnostic data

At a representative narrow mobile viewport, very long identifiers and diagnostic strings must not create document-level horizontal overflow.

Horizontal overflow remains allowed inside intentionally scrollable local containers such as the Processing Flow track.

The test should use unusually long but syntactically valid diagnostic values for event/run/item identifiers and related payload fields.

## Verification ownership

These scenarios belong to the deterministic `npm run e2e` suite and therefore remain part of `./run_checks.sh`.

Do not add a new browser-test framework or make routine verification depend on a live backend.

## Non-goals

This slice does not:

- add visual snapshot/golden-image testing;
- reproduce backend persistence, Kafka, deduplication, or flow reconstruction rules;
- add a full WCAG audit framework;
- add synthetic load/performance testing;
- replace the opt-in live-backend Playwright workflow.

## Acceptance criteria

This slice is accepted when:

- keyboard-only detail selection works on the four core tabular inspection screens;
- reconnect/resnapshot behavior is protected without duplicate Results rows;
- stale deep links remain safe against bounded snapshots;
- partial flow evidence remains explicit;
- long diagnostic data stays contained at a narrow viewport while local flow scrolling remains available;
- the new scenarios run under the normal deterministic Playwright command;
- `./run_checks.sh` passes;
- current-state documentation describes the strengthened verification coverage.
