---
type: Specification
title: Viewer-oriented Results experience
description: Add a consumer-facing VIEWER Results list/detail experience over the existing backend Results REST and SSE contracts without exposing admin diagnostics.
document_role: subspec
spec_status: active
parent: ../spec-signal-harvester-web.md
---
# Viewer-oriented Results experience

## Status

Active implementation focus. Runtime code and deterministic browser coverage are implemented in this patch; developer acceptance remains pending until the canonical repository gate passes.

## Feature scope

- `WEB.VIEWER_RESULTS` — consumer-facing Results browsing for explicit `VIEWER` identities.
- `WEB.RESULTS_LIVE` — reuse the accepted race-free Results REST/SSE synchronization model.
- `WEB.AUTHORIZATION_UX` — select viewer vs operational presentation from explicit additive roles while backend authorization remains authoritative.
- `WEB.CONTRACT_INTEGRATION` — reuse the existing Results schemas and endpoints without a duplicate viewer API.
- `WEB.BROWSER_VERIFICATION` — deterministic viewer request/presentation coverage.
- `WEB.ROUTE_DELIVERY` — keep the viewer screen as a route-level dynamic entry.

Related backend feature IDs:

- `PRESENTATION.VIEWER_RESULTS`;
- `RESULTS.BROWSING`;
- `RESULTS.LIVE`;
- `SECURITY.AUTHORIZATION`;
- `CONTRACTS.HTTP`.

## Goal

Give an authenticated identity with explicit `VIEWER` a useful Result-consumption workflow at `/results` without exposing operational pipeline, event, trace, identity, or infrastructure diagnostics that belong to the ADMIN experience.

The stage must reuse the accepted backend Results REST and SSE contracts. Different presentation alone must not introduce a duplicate backend API.

## Baseline before this slice

The accepted authentication foundation already routes `VIEWER` principals to `/results`, but viewer-only principals currently receive a placeholder. The existing operational Results screen is presented only when the principal has both explicit `ADMIN` and explicit `VIEWER` because it exposes diagnostic cross-navigation and internal provenance.

The backend already authorizes `VIEWER` for:

- `GET /api/v1/results`;
- `GET /api/v1/results/{normalizedItemId}`;
- `GET /api/v1/results/stream`.

The same contracts contain both consumer-useful content and internal provenance fields. This stage changes browser presentation, not backend authorization or wire shape.

## Requirements

### V1 — role-specific `/results` presentation

Features: `WEB.VIEWER_RESULTS`, `WEB.AUTHORIZATION_UX`.

`/results` must remain one authenticated route.

- explicit `VIEWER` without `ADMIN` must render the viewer-oriented Results experience;
- explicit `ADMIN` + `VIEWER` must retain the existing operational Results experience;
- `ADMIN` without `VIEWER` must remain denied Results access;
- no role hierarchy may be inferred.

The viewer experience must stay inside the existing application shell. A second frontend application must not be introduced.

### V2 — relevant Result feed over existing contracts

Features: `WEB.VIEWER_RESULTS`, `WEB.CONTRACT_INTEGRATION`.

The viewer list must use the existing `GET /api/v1/results` contract and request `relevant=true` by default and after filter reset.

The browser must not implement a separate relevance algorithm. Backend Result state remains authoritative.

The first bounded viewer list may remain limited to the existing backend maximum/bounded query model. This stage must not invent client-side pagination semantics that the backend does not publish.

### V3 — consumer-safe filters

Feature: `WEB.VIEWER_RESULTS`.

The viewer surface may expose filters that are meaningful without operational knowledge. The first slice exposes:

- information category;
- analyzed-from time;
- analyzed-to time.

The viewer surface must not expose Monitoring Profile ID, Source ID, normalized item ID, event ID, correlation ID, trace ID, Kafka metadata, or ADMIN diagnostic filters as normal viewer controls.

### V4 — consumer-oriented Result detail

Feature: `WEB.VIEWER_RESULTS`.

Selecting a Result may load `GET /api/v1/results/{normalizedItemId}` internally, but the rendered viewer detail must focus on consumer content:

- title when available;
- information category;
- source URL as an external source action;
- publication/analyzed times;
- explanation/summary;
- tags;
- normalized category-specific attributes;
- normalized content.

The viewer detail must not render operational identifiers or diagnostic metadata, including:

- Monitoring Profile ID;
- Source ID;
- normalized/raw item IDs;
- analysis/source event IDs;
- correlation ID;
- traceparent;
- analyzer implementation identity;
- Processing Flow or Event Explorer actions.

This is a presentation boundary. The frontend must not claim that hidden fields are secret or absent from the backend transport contract.

### V5 — live updates and durable recovery

Features: `WEB.VIEWER_RESULTS`, `WEB.RESULTS_LIVE`.

The viewer feed must reuse the accepted `useLiveList` Results synchronization behavior:

1. open credentialed Results SSE;
2. wait for `ready`;
3. fetch the durable REST snapshot;
4. merge matching live updates into TanStack Query state;
5. preserve bounded reconnect/resnapshot behavior.

The stream request must include `relevant=true` and other SSE-supported viewer filters. Analyzed time bounds, which are not published as SSE filters, may be applied to received live Result summaries in the browser.

### V6 — no diagnostic cross-navigation

Features: `WEB.VIEWER_RESULTS`, `WEB.AUTHORIZATION_UX`.

The viewer Results screen must not present links into ADMIN-only Event Explorer, Processing Flow, Analysis Items, configuration, Collection Runs, or identity administration.

The existing role-aware shell continues to hide those navigation entries for principals without `ADMIN`.

### V7 — accessibility and responsive containment

Features: `WEB.VIEWER_RESULTS`, `WEB.ACCESSIBILITY`, `WEB.RESPONSIVE_LAYOUT`.

The Result feed and detail must use semantic controls, visible focus, accessible names, explicit loading/error/empty states, and the existing responsive shell conventions.

Long Result content and attribute values must remain contained without forcing page-wide horizontal overflow.

### V8 — deterministic browser verification

Feature: `WEB.BROWSER_VERIFICATION`.

Backend-independent Playwright coverage must verify at least:

1. a viewer-only principal receives the viewer Results screen rather than the operational placeholder;
2. list and SSE requests preserve `relevant=true`;
3. consumer-safe filters do not add admin-only identifiers;
4. selecting a Result loads the existing detail endpoint;
5. consumer content is visible;
6. operational identifiers, analyzer/event/correlation/trace metadata, and diagnostic links are not rendered;
7. ADMIN-only navigation remains absent.

Tests must verify browser/request boundaries rather than recreate backend authorization or Result analysis semantics.

### V9 — production route verification

Feature: `WEB.ROUTE_DELIVERY`.

`ViewerResultsPage` must be a Vite dynamic route entry and be included in production manifest verification alongside the existing operational `ResultsPage`.

## Non-goals

This stage does not add:

- a duplicate viewer-specific backend Results API;
- new backend search or cursor pagination;
- saved searches, notifications, favorites, or read/unread state;
- profile/source display-name lookup that the current Results contract does not provide;
- viewer access to Analysis Items, Event Explorer, Processing Flow, configuration, operations, or identity administration;
- changes to backend Result authorization.

## Validation

The stage is ready for acceptance when:

- `npm run api:generate` succeeds;
- `npm run typecheck` succeeds;
- deterministic viewer Results Playwright scenarios pass;
- the full `npm run e2e` suite passes;
- production build/asset verification includes both Results route variants;
- `./run_checks.sh` passes.
