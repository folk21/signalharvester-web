---
type: Roadmap
title: SignalHarvester Web roadmap
description: Compact frontend roadmap, backend dependencies, and current implementation direction.
---
# SignalHarvester Web roadmap

## Current focus

The current bounded focus is live Results and Event Explorer integration over the backend SSE contracts. Monitoring Profiles, Source Test, and profile-driven manual runs are accepted.

The next bounded slice after this work is processing-flow visualization over the already available reconstruction API.

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

Implemented in the current verification-pending slice:

- subscribe to new Results without manual refresh;
- reconnect safely after transient network failure;
- merge live notifications with durable REST state;
- preserve filters and selected detail while new data arrives;
- make connection state visible when useful.

Polling should not become the long-term replacement for the planned SSE boundary.

## P1 — event diagnostics

Implemented in the current verification-pending slice:

- add a bounded live Event Explorer;
- filter by event type, producer/service, topic, correlation ID, run, and item where supported;
- allow navigation from a run or result into correlated technical events;
- avoid exposing raw Kafka as a browser protocol.

## P1 — processing-flow visualization

The backend can now reconstruct bounded correlated flows. The diagnostic frontend slice should:

- visualize source -> collection -> Kafka -> analysis -> persistence -> result stages;
- show timestamps and durations where available;
- expose identifiers and Kafka metadata useful for diagnosis;
- link flow stages to Results and event details;
- keep the visualization diagnostic rather than pretending to replace distributed tracing.

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

The frontend roadmap intentionally does not invent contracts for missing backend capabilities. The backend contracts required for the current configuration and planned live-diagnostic frontend work are available: monitoring profiles, Source Test, Results SSE, Event Observation, and processing-flow reconstruction.

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
