---
type: Roadmap
title: SignalHarvester Web roadmap
description: Compact frontend roadmap, backend dependencies, and current implementation direction.
---
# SignalHarvester Web roadmap

## Current focus

The current bounded focus is live diagnostic acceptance against a separately running backend. Processing Flow visualization, Monitoring Profiles, Source Test, profile-driven manual runs, live Results, Event Explorer, and the UI resilience/edge-case suite are accepted.

Targeted visual regression is implemented with one reviewed Results/detail golden and remains a verification-pending supporting track. The active live slice extends the real browser acceptance path through Results SSE, Event Observation SSE, and Processing Flow.

## Completed baseline

The current baseline includes:

- React/TypeScript/Vite application composition;
- checked-in backend OpenAPI snapshot and generated TypeScript schema types;
- Dashboard;
- Sources CRUD;
- manual Collection Run execution and inspection;
- Analysis inspection;
- Results list/filter/detail;
- local Vite proxy for the standard backend development workflow;
- deterministic Playwright browser coverage plus an opt-in live-backend E2E workflow;
- canonical routine frontend verification through `run_checks.sh`.

Browser verification was accepted on 2026-09-14 after both `./run_checks.sh` and `npm run e2e:live` passed in the developer environment.

## P1 — complete configuration experience

Implemented and accepted:

- monitoring-profile CRUD;
- ordered source assignment to profiles;
- interval and scheduled enabled-state configuration;
- information category and criteria configuration;
- source validation/test action with bounded extracted-item preview;
- profile selection for manual Collection Runs.

Dedicated analysis-setting controls remain deferred until the backend publishes a corresponding contract. The browser validates known input constraints while backend validation remains authoritative.

## P1 — live Results

Implemented and accepted:

- subscribe to new Results without manual refresh;
- reconnect safely after transient network failure;
- merge live notifications with durable REST state;
- preserve filters and selected detail while new data arrives;
- make connection state visible when useful.

Durable REST snapshots remain the recovery boundary; polling is not used as a replacement for SSE.

## P1 — event diagnostics

Implemented and accepted:

- add a bounded live Event Explorer;
- filter by event type, producer/service, topic, correlation ID, run, and item where supported;
- allow navigation from a run or result into correlated technical events;
- avoid exposing raw Kafka as a browser protocol.

## P1 — processing-flow visualization

Implemented and accepted:

- visualize source -> collection -> Kafka -> analysis -> persistence -> result stages;
- show timestamps, durations, evidence classification, and reconstruction limitations;
- expose identifiers and Kafka metadata useful for diagnosis;
- support run-level and run-scoped item-level inspection;
- link Collection Runs, Results, Events, and flow stages into one diagnostic navigation model;
- keep the visualization diagnostic rather than pretending to replace distributed tracing.


## P1 — UI resilience and edge-case verification

Implemented and accepted:

- exercise keyboard-only detail selection across tabular diagnostic screens;
- verify SSE error/reconnect resynchronization without duplicate logical rows;
- verify stale Result/Event deep links when bounded snapshots no longer contain the requested record;
- verify partial Processing Flow reconstruction and explicit missing evidence;
- verify long diagnostic values at a narrow mobile viewport without document-level horizontal overflow;
- keep these checks deterministic and part of the normal Playwright suite.

## P1 — targeted visual regression

Implemented; verification pending:

- keep one reviewed golden for the dense populated Results/detail composition;
- compare it during the normal deterministic Playwright suite;
- require an explicit update command for intentional layout changes;
- review actual/diff artifacts instead of increasing tolerance blindly;
- add future baselines only when they protect a distinct stable layout risk.

## P1 — live diagnostic acceptance

Current focus; implementation complete and live verification pending:

- establish the filtered Results SSE stream before the first real Collection Run and receive both fixture Results without manual refresh;
- establish Event Observation SSE before the second real Collection Run and receive a newly correlated observed event without manual refresh;
- navigate from a real Analysis event into its run-scoped item Processing Flow;
- verify the corresponding full Collection Run flow contains both deterministic RSS branches;
- keep the scenario bounded, deterministic, and based on the existing local RSS fixture rather than public internet data.

This stage strengthens frontend/backend contract acceptance without duplicating backend Kafka, persistence, deduplication, or reconstruction semantics in browser assertions.

## P2 — accessibility hardening

Build on the existing keyboard-selection coverage with focused checks for landmarks, accessible names, labels, focus order, focus restoration, and semantic error presentation. Prefer native semantic HTML and deterministic Playwright assertions. Add a dedicated accessibility dependency only when its maintenance cost and additional coverage are explicitly justified.

## P2 — delivery and security hardening

Before public/shared deployment:

- add authentication and authorization;
- define the cross-origin deployment policy;
- verify keyboard/accessibility behavior across core workflows;
- add production frontend deployment assets as required by the platform deployment design;
- integrate frontend health/build verification into the intended deployment workflow.

## P2 — UX hardening

After core behavior stabilizes:

- improve responsive behavior for narrower screens;
- improve large-table navigation when backend pagination contracts exist;
- add reusable form primitives only where repetition justifies them;
- refine dashboard summaries as product priorities become clearer.

## Backend dependencies

The frontend roadmap intentionally does not invent contracts for missing backend capabilities. The backend contracts required for current configuration and diagnostics are available: monitoring profiles, Source Test, Results SSE, Event Observation, and processing-flow reconstruction.

Remaining major backend/product dependencies include:

- dedicated analysis-setting configuration beyond the current criteria map;
- authentication/authorization contract;
- production deployment and observability integration.

## Deferred until justified

- a second frontend application for product vs admin screens;
- Redux or another global client-state framework;
- a large component framework;
- WebSockets where SSE is sufficient;
- frontend access to Kafka, PostgreSQL, or backend implementation models.
