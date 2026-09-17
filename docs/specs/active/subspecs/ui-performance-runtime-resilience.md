---
type: Specification
title: Frontend performance and runtime resilience
description: Split major screens into route-level chunks, keep the shell usable during lazy loading, recover from route chunk failures, and establish a reproducible production asset baseline.
document_role: subspec
spec_status: verification-pending
parent: ../spec-signal-harvester-web.md
---
# Frontend performance and runtime resilience

## Status

Implementation complete. Developer verification pending.

The implementation remains active because the acceptance commands in this specification have not yet been recorded as passing for this slice.

## Feature scope

Frontend features:

- `WEB.ROUTE_DELIVERY` — route-level code splitting, loading state, failure containment, and production asset structure;
- `WEB.BROWSER_VERIFICATION` — deterministic browser coverage for delayed and failed route-module delivery;
- `WEB.ASYNC_FEEDBACK` — accessible loading and failure presentation during route transitions.

Related backend feature IDs:

- `DELIVERY.FRONTEND_BACKEND_BOUNDARY` — independent frontend/backend delivery remains the cross-project boundary;
- `TESTING.DETERMINISTIC_LOCAL` — deterministic local verification remains the relevant backend-side testing principle.

This slice does not change a backend REST/SSE contract.

## Goal

Improve initial browser delivery and route-failure containment without introducing a new framework, service worker, analytics vendor, or backend contract.

The slice establishes route-level code splitting, explicit lazy-route states, and a reproducible production asset report. Numeric bundle budgets remain deferred until the measured baseline has been reviewed.

## Current state

The implementation already includes:

- dynamic imports for the primary feature screens;
- an application shell that remains mounted while a route chunk loads;
- an accessible route-loading status;
- a route-resetting error boundary with a full-page reload action;
- deterministic Playwright scenarios for delayed and failed route-module delivery;
- Vite manifest generation;
- repository tooling that verifies dynamic route entries and reports raw/gzip asset sizes.

Acceptance is still pending the validation commands listed below.

## Relationship to the umbrella specification

This slice strengthens:

- `UI-R12` / `WEB.ASYNC_FEEDBACK` — route loading and route failure remain explicit browser states;
- `UI-R14` / `WEB.BROWSER_VERIFICATION` — deterministic browser verification covers route-delivery failure;
- `UI-R15` and `UI-R20` / `WEB.ROUTE_DELIVERY` — the independently built frontend preserves route-level delivery boundaries and reproducible production structure.

Delivery/security work remains separate because authentication, authorization, cross-origin exposure policy, and production deployment require their own coordinated scope.

## Requirements

### R1 — route-level code splitting

The main operational screens must load through dynamic route imports rather than all feature modules being included eagerly in the initial application module graph.

The application shell and navigation must remain part of the initial shell so a route transition does not blank the entire interface while a feature chunk loads.

### R2 — explicit route loading state

While a route chunk is pending, the main content region must expose an accessible loading status.

Existing shell navigation must remain visible and usable.

### R3 — route failure containment

A failed lazy-route import or route render failure must be contained inside the main content area by an error boundary instead of replacing the application with a blank screen.

The fallback must:

- expose an alert;
- explain that the screen could not be loaded;
- provide a full-application reload action;
- allow navigation to another route, which resets the failed route boundary.

### R4 — reproducible build structure verification

The production build must emit a Vite manifest.

Repository verification must assert that each primary feature page remains a dynamic build entry so accidental eager-import regressions are caught automatically.

### R5 — measured asset baseline without invented budgets

After the production build, repository tooling must report generated JavaScript/CSS raw and gzip sizes plus totals.

This baseline is informational. It must not fail on an arbitrary byte threshold until a measured baseline and acceptable growth policy have been reviewed.

### R6 — deterministic browser verification

The backend-independent Playwright suite must verify this sequence for delayed route delivery:

1. hold one route-module request;
2. keep the application shell visible and usable;
3. expose the loading status while the request is held;
4. release the module request;
5. complete normal screen rendering.

The suite must also verify this sequence for route failure:

1. abort one lazy-route module request;
2. show the recoverable route error UI;
3. keep the shell available;
4. navigate to another route;
5. render that route successfully after the failed screen.

## Non-goals

This slice does not:

- add an external error-reporting or analytics service;
- define OpenTelemetry browser export without a platform endpoint/policy;
- add a service worker or offline application behavior;
- preload every route and thereby defeat route splitting;
- introduce speculative numeric bundle-size limits;
- change REST/SSE contracts;
- implement authentication or authorization.

## Validation

The slice is accepted only when all of the following pass:

1. the focused route-loading/runtime-failure Playwright scenarios;
2. `npm run e2e`;
3. `npm run build` with a Vite manifest and split route assets;
4. `npm run build:assets` with all expected dynamic route entries present and asset sizes reported;
5. `npm run e2e:visual` without updating the reviewed baseline;
6. `./run_checks.sh`.

After acceptance, move stable delivery/testing knowledge into the owning current-state documents, archive this sub-spec, and update the umbrella/current-focus indexes in the same lifecycle change.
