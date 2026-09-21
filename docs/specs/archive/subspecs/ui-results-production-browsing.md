---
type: Specification
title: Production-oriented Results browsing
description: Accepted frontend consumption of backend text search and opaque keyset continuation while preserving Results SSE semantics.
document_role: subspec
spec_status: completed
parent: ../spec-signal-harvester-web.md
---
# Production-oriented Results browsing

## Status

Accepted on 2026-09-21 after the developer confirmed the canonical frontend gate passed.

The synchronized backend contract publishes REST `search`, opaque `cursor`, and additive `X-Next-Cursor` metadata while keeping the existing `ResultSummary[]` body and the separate Results SSE contract. The frontend consumes those REST capabilities in both operational and viewer Results presentations while preserving the independent Results SSE contract.

## Feature scope

- `WEB.RESULTS_BROWSING` — backend full-text search and explicit keyset continuation.
- `WEB.VIEWER_RESULTS` — consumer-safe search and continuation while retaining `relevant=true`.
- `WEB.RESULTS_LIVE` — correct reconciliation when REST-only search cannot be represented by SSE.
- `WEB.CONTRACT_INTEGRATION` — consume additive query/header metadata without redefining backend cursor semantics.
- `WEB.BROWSER_VERIFICATION` — deterministic coverage of search, continuation, reset, failure, and SSE reconciliation.

Related backend feature IDs:

- `RESULTS.BROWSING`;
- `RESULTS.LIVE`;
- `CONTRACTS.HTTP`.

## Goal

Let users browse beyond the first bounded Results window and use backend-owned full-text search without changing the accepted REST body or confusing REST keyset cursors with durable SSE resume cursors.

The browser must treat the backend cursor as opaque, keep pagination user-driven, and preserve the existing race-free SSE-before-REST bootstrap.

## Current state

The backend `GET /api/v1/results` contract returns `ResultSummary[]`, accepts the existing structured filters plus optional `search` and `cursor`, and exposes `X-Next-Cursor` only when another page exists. The cursor is bound to all query criteria except `limit`; criteria mismatch or malformed cursors return HTTP 400.

Backend search uses Results-owned PostgreSQL full-text search over title and normalized content. `GET /api/v1/results/stream` does not accept REST `search` or page cursors. Its filtering/resume semantics remain independent.

The frontend transport now retains the backward-compatible array helper for callers that do not need pagination and adds a Results browsing operation that returns the array plus `nextCursor` derived from the response header.

## Requirements

### R1 — backend-owned text search

Features: `WEB.RESULTS_BROWSING`, `WEB.VIEWER_RESULTS`, `WEB.CONTRACT_INTEGRATION`.

Operational and viewer Results must expose one text-search input backed by the REST `search` query parameter.

The browser must not parse or reproduce PostgreSQL/web-search semantics. It may enforce the explicit OpenAPI maximum input length, while backend validation remains authoritative.

Search must compose with each presentation's existing structured filters. Viewer search must continue to force `relevant=true` and must not expose operational identifiers or classification controls.

### R2 — opaque explicit continuation

Features: `WEB.RESULTS_BROWSING`, `WEB.CONTRACT_INTEGRATION`.

When `X-Next-Cursor` is present, the UI must expose an explicit **Load more** action. The next REST request must send the cursor unchanged with the same filter/search criteria.

The browser must not decode, construct, persist, or derive meaning from the cursor. The cursor is transport state, not a user-facing URL filter.

When the response omits `X-Next-Cursor`, no continuation action is shown.

### R3 — criteria changes reset the continuation chain

Feature: `WEB.RESULTS_BROWSING`.

Applying changed search or structured filters must request a fresh first page without the previous cursor and clear continuation errors/state from the prior criteria.

Manual refresh and SSE-driven REST reconciliation also restart from the first page and replace any previously appended continuation pages.

### R4 — page merge and mutable projection safety

Features: `WEB.RESULTS_BROWSING`, `WEB.SERVER_STATE`.

Continuation pages must append in backend order and de-duplicate by the Results logical identity `(monitoringProfileId, normalizedItemId)`.

A duplicate returned by a later page must not create a second rendered row/card. The browser must not assume the backend provides a cross-request database snapshot.

### R5 — REST/SSE separation

Features: `WEB.RESULTS_LIVE`, `WEB.CONTRACT_INTEGRATION`.

REST `search` and page `cursor` must never be added to `/api/v1/results/stream`.

When no text search is active, accepted live behavior continues: SSE-supported structured filters are sent to the stream, and analyzed-time bounds that are present in `ResultSummary` may still be checked client-side before merging a live row.

When text search is active, the browser must not decide whether an SSE `ResultSummary` matches backend full-text search. A received Result event must instead trigger a first-page REST reconciliation using the active search and structured filters. The REST response remains authoritative for search membership.

Search reconciliation may reset previously loaded continuation pages; correctness of the current searched projection takes precedence over preserving a stale cursor chain.

### R6 — continuation failures preserve usable data

Feature: `WEB.ASYNC_FEEDBACK`.

If a continuation request fails, already loaded Results must remain visible. The error must be explicit and retryable with the same opaque cursor.

Initial snapshot failures continue to use the existing Results snapshot error/retry behavior.

### R7 — deterministic browser coverage

Feature: `WEB.BROWSER_VERIFICATION`.

Deterministic Playwright coverage must prove at least:

- operational search is sent with existing filters;
- viewer search keeps `relevant=true` and does not add operational filters;
- `X-Next-Cursor` exposes **Load more** and the continuation request sends the exact cursor;
- the final page removes the continuation action;
- duplicate identities across pages render only once;
- changing search criteria starts again without the old cursor;
- continuation HTTP failure is visible without discarding the current page;
- REST `search` and page `cursor` never appear in the SSE URL;
- a Result SSE event during active search causes REST reconciliation rather than client-side full-text matching.

## Failure semantics

- Backend `400` for malformed/criteria-mismatched cursors is shown as a continuation request error; the browser does not rewrite the cursor.
- A failed continuation does not invalidate the successful first/earlier pages already in TanStack Query.
- A failed search reconciliation follows the existing durable-snapshot error path and leaves the previous cached Results visible until a later successful reconciliation.
- SSE reconnect behavior remains owned by the existing live-list lifecycle.

## Non-goals

This stage does not add:

- relevance-ranked or fuzzy search;
- frontend parsing of PostgreSQL search expressions;
- OFFSET pagination or page numbers;
- infinite scrolling;
- cursor persistence in browser URLs or storage;
- backend display-name joins for Monitoring Profiles or Sources;
- category-specific result layouts;
- a new Results API response wrapper;
- changes to backend SSE cursor/filter semantics.

## Validation

The implementation is ready for acceptance when:

- focused unit coverage protects continuation de-duplication/live-list merge behavior;
- deterministic Playwright covers R7;
- generated OpenAPI types remain reproducible from the synchronized snapshot;
- `./run_checks.sh` passes;
- optional live/deployed acceptance confirms the browser can search and continue real persisted Results when enough disposable fixture data exists.
