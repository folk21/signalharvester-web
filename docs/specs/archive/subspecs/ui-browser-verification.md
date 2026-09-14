---
type: Specification
title: UI browser verification
description: Deterministic browser automation for current SignalHarvester Web workflows plus one bounded live-backend E2E path.
document_role: subspec
spec_status: completed
parent: ../../active/spec-signal-harvester-web.md
---
# UI browser verification

## Status

Completed and accepted on 2026-09-14.

## Goal

Add browser-level verification for the already implemented SignalHarvester Web screens before expanding the UI into monitoring profiles, SSE, and event-flow diagnostics.

The browser suite should catch frontend regressions in navigation, REST integration, forms, filters, query states, and rendering without duplicating backend persistence/Kafka/domain tests.

## Relationship to the umbrella specification

This slice implements umbrella requirement UI-R14 and supports UI-R2, UI-R3, UI-R6, UI-R7, UI-R8, UI-R12, and UI-R17.

It does not add new backend product behavior.

## Current state

The repository contains Playwright browser automation in two layers. `npm run e2e` uses controlled REST responses and does not require a backend. `npm run e2e:live` exercises a separately running backend with a temporary deterministic two-entry RSS source.

Vitest discovery is explicitly restricted to unit/component test locations so `npm test` cannot collect Playwright specs from `tests/e2e/**`. The canonical routine checks and the opt-in live backend workflow were both accepted in the developer environment on 2026-09-14.

## Requirements

### R1 — Playwright is the initial browser tool

Use Playwright for browser automation unless implementation discovers a concrete incompatibility.

Keep the initial dependency/configuration small. Do not add a second browser-test framework.

### R2 — fast browser behavior is deterministic

Browser tests that validate rendering, navigation, form behavior, filters, loading/error/empty states, and request construction should use controlled REST responses.

These tests must not require PostgreSQL, Kafka, the backend application, or public network access.

### R3 — contract-shaped fixtures

Mocked REST responses must conform to the checked-in OpenAPI-derived frontend types.

Do not create an unrelated second domain model solely for tests.

### R4 — current screens receive smoke coverage

The initial browser suite should cover at least:

- application shell/navigation;
- Sources list rendering and one mutation flow;
- Collection Runs list/detail and manual-run request behavior;
- Analysis filter/request behavior;
- Results list/filter/detail behavior.

The suite should prefer a few meaningful scenarios over exhaustive visual assertions.

### R5 — async states are covered

At least representative screens must verify:

- loading behavior where stable to test;
- backend request failure presentation;
- successful empty response;
- successful populated response.

### R6 — one live backend E2E path

Provide an opt-in browser workflow that runs against a separately running real backend.

The live workflow should prove a bounded cross-project path such as:

```text
browser -> Sources/configuration -> manual Collection Run -> Analysis/Results visibility
```

The test must not depend on an unstable public website. Prefer deterministic local fixture data or backend-owned deterministic verification support.

### R7 — live E2E remains separate from routine fast tests

The repository must distinguish fast deterministic browser tests from live backend E2E.

Expected command shape:

```text
npm test
npm run e2e
npm run e2e:live
```

Exact script names may be refined during implementation, but live backend requirements must remain explicit and opt-in.

### R8 — frontend assertions stay frontend-owned

Browser tests should assert what a user/browser can observe:

- page content;
- enabled/disabled controls;
- navigation;
- request payload/query construction;
- error/empty/loading states;
- visible backend results.

They should not assert Kafka offsets, direct database rows, transaction boundaries, or backend deduplication internals.

### R9 — failure diagnostics are actionable

Browser-test failures should retain useful artifacts where practical, such as Playwright traces or screenshots on failure.

Routine successful runs should not generate large checked-in artifacts.

### R10 — canonical verification workflow is documented

After implementation, update root documentation with the browser-test commands and prerequisites.

If the project introduces a canonical repository-wide check script later, fast browser verification should be included there. Live-backend E2E should remain opt-in unless the repository can start and own all of its dependencies deterministically.

## Non-goals

- reproducing backend integration tests in TypeScript;
- testing every CSS detail or taking screenshot snapshots of the whole application by default;
- requiring public internet access;
- starting Kafka/PostgreSQL from frontend unit tests;
- adding monitoring profiles, SSE, or Event Explorer behavior in this slice.

## Validation

The slice is accepted when:

- Playwright installs and runs through repository scripts;
- deterministic browser tests pass without a backend process;
- current core screens have bounded smoke coverage;
- a documented live E2E command can run against a separately running backend;
- the live scenario uses deterministic data and verifies visible UI state;
- `npm run typecheck`, `npm test`, browser tests, and `npm run build` all pass in the developer environment.

Run the acceptance sequence with:

```bash
npm ci
npm run e2e:install
./run_checks.sh
```

With a backend already running on the host, also run:

```bash
SIGNALHARVESTER_BACKEND_URL=http://127.0.0.1:8080 npm run e2e:live
```

## Implementation status

Implemented in this slice:

- Playwright dependency and separate deterministic/live configurations;
- explicit Vitest discovery that excludes the Playwright suite;
- typed fixtures based on existing OpenAPI-derived API aliases;
- route-mocked browser coverage for navigation and all current operational screens;
- representative loading, error, empty, and populated states;
- one live backend E2E scenario using a temporary two-entry RSS server;
- package scripts, canonical `run_checks.sh`, and ignored failure artifacts;
- README, architecture, implementation, usage, and roadmap updates.

Acceptance was completed on 2026-09-14. `./run_checks.sh` passed OpenAPI generation, TypeScript checks, Vitest, seven deterministic Chromium Playwright scenarios, and the production build. `npm run e2e:live` also passed the deterministic RSS-to-Analysis-to-Results browser workflow against a real running backend.

Stable verification behavior now belongs to the current-state documentation. This archived sub-spec remains historical implementation context.
