---
type: Roadmap
title: SignalHarvester Web roadmap
description: Compact frontend roadmap, backend dependencies, and current implementation direction.
---
# SignalHarvester Web roadmap

## Current focus

The current frontend covers the backend operational/admin APIs for Sources, manual Collection Runs, Analysis inspection, and Results browsing. Browser verification is implemented and accepted, including deterministic Playwright coverage and the opt-in live-backend workflow.

There is no active bounded frontend sub-spec. The next planned product work is the configuration experience, which depends on new backend contracts. Results SSE and event diagnostics are also blocked on their backend contracts.

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

This work depends on backend contracts that are not implemented yet.

Planned UI capabilities:

- monitoring-profile CRUD;
- source assignment to profiles;
- schedule/interval configuration;
- search or matching criteria;
- initial analysis settings;
- source validation/test action with bounded extracted-item preview.

The browser must validate known input constraints, while backend validation remains authoritative.

## P1 — live Results

After the backend exposes the Results SSE contract:

- subscribe to new Results without manual refresh;
- reconnect safely after transient network failure;
- merge live notifications with durable REST state;
- preserve filters and selected detail while new data arrives;
- make connection state visible when useful.

Polling should not become the long-term replacement for the planned SSE boundary.

## P1 — event diagnostics

After event-observation backend APIs exist:

- add a bounded live Event Explorer;
- filter by event type, producer/service, topic, correlation ID, run, and item where supported;
- allow navigation from a run or result into correlated technical events;
- avoid exposing raw Kafka as a browser protocol.

## P1 — processing-flow visualization

Once the backend can reconstruct bounded correlated flows:

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

The frontend roadmap intentionally does not invent contracts for missing backend capabilities. Major pending backend dependencies include:

- persisted monitoring profiles and schedules;
- source-test/preview capability;
- Results SSE;
- event-observation APIs and persistence;
- correlated processing-flow read model;
- authentication/authorization contract;
- production deployment and observability integration.

## Deferred until justified

- a second frontend application for product vs admin screens;
- Redux or another global client-state framework;
- a large component framework;
- WebSockets where SSE is sufficient;
- frontend access to Kafka, PostgreSQL, or backend implementation models.
