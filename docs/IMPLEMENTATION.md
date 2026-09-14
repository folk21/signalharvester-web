---
type: Implementation Guide
title: Current implementation
description: Current implemented SignalHarvester Web screens, API usage, code organization, and known limitations.
---
# Current implementation

## Purpose

This document describes what the frontend currently implements. Active specifications describe intended changes and must not be read as evidence that a feature already exists.

The current branch includes the Monitoring Profiles / Source Test slice. Its automated acceptance is still pending until `./run_checks.sh` and the opt-in live browser workflow pass in the developer environment.

## Current screens

| Screen | Route | Current capability | Backend boundary |
|---|---|---|---|
| Dashboard | `/` | Shows source/profile, collection, analysis, and recent Results summaries | Existing REST reads |
| Sources | `/sources` | Lists, creates, edits, enables/disables, deletes, and diagnostically tests sources | `/api/v1/sources`, `/api/v1/sources/{sourceId}/test` |
| Monitoring Profiles | `/profiles` | CRUD for persisted profiles, interval, source membership, criteria, and scheduled enabled state | `/api/v1/monitoring-profiles` |
| Collection Runs | `/runs` | Starts persisted profiles manually, lists recent runs, and inspects durable source outcomes | `/api/v1/admin/collection-runs` |
| Analysis Items | `/analysis` | Inspects normalized/deduplication state with profile/source filters | `/api/v1/admin/analysis/items` |
| Results | `/results` | Lists analyzed Results with filters and loads full detail on selection | `/api/v1/results` |

The application shell remains one coherent operational/product frontend. Live Results and diagnostic event/flow screens are the next major frontend slice.

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

The backend now exposes Results SSE, but the current browser still uses REST only. Live Results integration belongs to the next frontend slice.

## Dashboard

The Dashboard combines small recent reads from Sources, Monitoring Profiles, Collection Runs, Analysis, and Results.

It is an operational overview rather than a separate backend aggregation contract. Dashboard queries should remain bounded; a dedicated backend summary endpoint should be introduced only if independent reads become inefficient or semantically inconsistent.

## API implementation

The frontend REST boundary is `src/api/client.ts`.

The current application uses the browser `fetch` API and converts non-success responses into a shared `ApiError`. REST schema types come from the checked-in OpenAPI document through `openapi-typescript`.

The checked-in OpenAPI snapshot now includes the backend Monitoring Profiles, Source Test, Results SSE, Event Observation, and processing-flow contracts. Only the REST configuration/run subset is consumed in this frontend slice.

No frontend code reads PostgreSQL or Kafka directly.

## Client state

TanStack Query owns remote/server state, including sources, monitoring profiles, runs, analysis items, and Results.

Page-local React state owns forms, filters, source-test presentation, and current selections. The application does not use a second global client-state library.

## Styling

The application uses one repository-owned global stylesheet and small reusable presentation components. There is no third-party component framework.

## Current verification

The repository's canonical routine verification is `./run_checks.sh`. It regenerates the checked-in API types, typechecks application and browser-test code, runs Vitest, runs deterministic Playwright browser tests, and builds the production frontend.

The deterministic browser suite now covers:

- application-shell navigation including Monitoring Profiles;
- Sources create behavior and Source Test diagnostics;
- Monitoring Profile create request construction and source membership;
- profile-driven manual Collection Run request/detail behavior;
- Analysis filters;
- Results filters/detail;
- representative loading/error/empty states.

The opt-in live Playwright workflow now owns a temporary RSS source and monitoring profile. It tests the source, runs the profile manually, waits for matching Analysis and Results data, and removes the profile before removing the source so backend referential integrity is respected.

The previously accepted browser-verification baseline passed in the developer environment on 2026-09-14. The current Monitoring Profiles / Source Test slice remains verification-pending until the updated routine and live checks pass.

## Current limitations

The following product capabilities are not implemented in the frontend:

- dedicated analysis-setting configuration beyond the current profile criteria map;
- automatic live Results updates through SSE;
- live technical Event Explorer;
- visual processing-flow inspection;
- authentication and authorization.

Backend contracts are already available for Results SSE, Event Observation, and processing-flow reconstruction. These are frontend work rather than backend blockers.
