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

## Goal

Improve initial browser delivery and failure containment without introducing a new framework, service worker, analytics vendor, or backend contract.

This slice establishes route-level code splitting, explicit lazy-route states, and a reproducible production asset report. Numeric bundle budgets remain deferred until the measured baseline has been reviewed instead of inventing an arbitrary threshold.

## Relationship to the umbrella specification

This slice strengthens `UI-R12`, `UI-R14`, and `UI-R15`: screen loading remains explicit, deterministic browser verification covers a frontend delivery failure, and the independently built frontend exposes a reproducible view of its production asset structure.

Delivery/security work remains separate because authentication, authorization, and final cross-origin exposure policy require coordinated backend contracts.

## Requirements

### R1 — route-level code splitting

The main operational screens must load through dynamic route imports rather than all feature modules being included eagerly in the initial application module graph.

The application shell and navigation remain part of the initial shell so a route transition does not blank the entire interface while a feature chunk loads.

### R2 — explicit route loading state

While a route chunk is pending, the main content region must expose an accessible loading status. Existing shell navigation must remain visible and usable.

### R3 — route failure containment

A failed lazy-route import or render failure must be contained inside the main content area by an error boundary instead of replacing the application with a blank screen.

The fallback must:

- expose an alert;
- explain that the screen could not be loaded;
- provide a full-application reload action;
- allow navigation to another route, which resets the failed route boundary.

### R4 — reproducible build structure verification

The production build must emit a Vite manifest. Repository verification must assert that each primary feature page remains a dynamic build entry so accidental eager-import regressions are caught automatically.

### R5 — measured asset baseline without invented budgets

After the production build, repository tooling must report generated JavaScript/CSS raw and gzip sizes plus totals.

This first baseline is informational. It must not fail on an arbitrary byte threshold until a measured baseline and acceptable growth policy have been reviewed.

### R6 — deterministic browser verification

The backend-independent Playwright suite must verify:

- the shell remains visible while a route module request is deliberately held;
- the loading status is visible during that hold;
- releasing the module request completes normal screen rendering;
- aborting a lazy-route module request presents recoverable error UI;
- navigation to another route succeeds after the failed screen.

## Non-goals

This slice does not:

- add an external error-reporting or analytics service;
- define OpenTelemetry browser export without a platform endpoint/policy;
- add a service worker or offline application behavior;
- preload every route and thereby defeat route splitting;
- introduce speculative numeric bundle-size limits;
- change REST/SSE contracts;
- implement authentication or authorization.

## Acceptance criteria

This slice is accepted when:

- the new route-loading/runtime-failure Playwright scenarios pass;
- the full deterministic `npm run e2e` suite passes;
- `npm run build` produces the Vite manifest and split route assets;
- `npm run build:assets` verifies all expected route dynamic entries and reports raw/gzip asset sizes;
- the reviewed visual comparison still passes;
- `./run_checks.sh` passes.
