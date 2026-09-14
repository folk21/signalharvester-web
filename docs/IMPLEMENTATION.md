---
type: Implementation Guide
title: Current implementation
description: Current implemented SignalHarvester Web screens, API usage, code organization, and known limitations.
---
# Current implementation

## Purpose

This document describes what the frontend currently implements. Active specifications describe intended changes and must not be read as evidence that a feature already exists.

## Current screens

| Screen | Route | Current capability | Backend boundary |
|---|---|---|---|
| Dashboard | `/` | Shows source, collection, analysis, and recent Results summaries | Existing REST reads |
| Sources | `/sources` | Lists, creates, edits, enables/disables, and deletes sources | `/api/v1/sources` |
| Collection Runs | `/runs` | Starts manual runs, lists recent runs, and inspects durable source outcomes | `/api/v1/admin/collection-runs` |
| Analysis Items | `/analysis` | Inspects normalized/deduplication state with profile/source filters | `/api/v1/admin/analysis/items` |
| Results | `/results` | Lists analyzed Results with filters and loads full detail on selection | `/api/v1/results` |

The current operational screens are useful on their own, but they are only part of the complete product UI defined by the active umbrella specification.

## Sources

The Sources screen currently supports the backend source CRUD contract:

- list configured sources;
- create a source;
- edit a source;
- enable or disable a source by updating its configuration;
- delete a source.

The form exposes the current backend source fields, including the source-specific settings map as JSON.

Interactive source testing and extracted-item preview are not implemented because the required backend source-test API does not exist yet.

## Collection Runs

The Collection Runs screen can start a manual collection run by providing the current request fields and can inspect recent durable runs and per-source outcomes.

It is an operational view. Automatic schedule management is not present because persisted monitoring profiles and scheduling remain backend work.

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

Results are currently REST-driven and do not update through SSE.

## Dashboard

The Dashboard combines small recent reads from the existing APIs. It is an operational overview rather than a separate backend aggregation contract.

As the product grows, dashboard queries should remain bounded. A dedicated backend summary endpoint should be introduced only if multiple independent reads become inefficient or semantically inconsistent.

## API implementation

The frontend REST boundary is `src/api/client.ts`.

The current application uses the browser `fetch` API and converts non-success responses into a shared `ApiError`. REST schema types come from the checked-in OpenAPI document through `openapi-typescript`.

No frontend code reads PostgreSQL or Kafka directly.

## Client state

TanStack Query owns remote/server state. Page-local React state owns forms, filters, and selections.

The application does not currently use a global client-state library.

## Styling

The application uses one repository-owned global stylesheet and small reusable presentation components. There is no third-party component framework.

## Current verification

The repository's canonical routine verification is `./run_checks.sh`. It regenerates the checked-in API types, typechecks application and browser-test code, runs Vitest, runs deterministic Playwright browser tests, and builds the production frontend.

The repository currently provides:

- strict application and browser-test TypeScript compilation through `npm run typecheck`;
- Vitest through `npm test`;
- deterministic Playwright browser tests through `npm run e2e`;
- an opt-in real-backend browser workflow through `npm run e2e:live`;
- production build verification through `npm run build`;
- OpenAPI type generation through `npm run api:generate`.

The fast Playwright suite starts a Vite server and intercepts REST requests in the browser. Typed fixtures use the existing OpenAPI-derived frontend types. The suite covers the application shell, Sources mutation behavior, Collection Run request/detail behavior, Analysis filters, Results filters/detail, and representative loading/error/empty states.

The live Playwright workflow creates a temporary deterministic RSS source through the UI, starts a Collection Run through the UI, waits for matching Analysis and Results data, and cleans up the source. It requires a separately running backend and is intentionally not part of routine fast verification.

Browser verification was accepted in the developer environment on 2026-09-14. The canonical `./run_checks.sh` workflow passed, and the opt-in `npm run e2e:live` workflow passed against a real running backend.

## Current limitations

The following product capabilities are not implemented in the frontend because either the frontend slice or the supporting backend contract is still pending:

- monitoring-profile CRUD;
- source-to-profile assignment;
- schedule configuration;
- search/matching criteria configuration;
- analysis-setting configuration;
- interactive source testing and bounded extraction preview;
- automatic live Results updates through SSE;
- live technical Event Explorer;
- visual processing-flow inspection;
- authentication and authorization;

These items belong in active specs and the roadmap rather than being presented as current behavior.
