---
type: Specification Guide
title: Frontend change specifications
description: SignalHarvester Web specification ownership, feature vocabulary, lifecycle, writing structure, and active navigation.
---
# Frontend change specifications

## Purpose

`docs/specs/` contains significant planned or in-progress frontend changes.

A specification defines intended browser behavior, design constraints, compatibility expectations, and validation targets. It is not canonical evidence of what the repository already implements.

Current implementation truth belongs in:

- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) for stable frontend boundaries;
- [`../IMPLEMENTATION.md`](../IMPLEMENTATION.md) for current screens and wiring;
- [`../USAGE.md`](../USAGE.md) for current workflows;
- [`../ROADMAP.md`](../ROADMAP.md) for sequencing and future work;
- [`../FEATURES.md`](../FEATURES.md) for stable frontend feature IDs.

The backend repository owns backend behavior and published REST/OpenAPI, SSE, security, persistence, and event semantics. Frontend specifications may refine browser behavior around those capabilities, but must not silently redefine backend contracts.

## Feature, requirement, and specification IDs

Keep three identifiers separate:

- **Feature ID** — a durable frontend capability from [`../FEATURES.md`](../FEATURES.md), for example `WEB.RESULTS_LIVE`.
- **Requirement ID** — a normative rule inside one specification, for example `UI-R9` or `R3`.
- **Specification name** — one planned or in-progress change, for example `ui-performance-runtime-resilience`.

Feature IDs survive specification archival. Requirement IDs are local to their owning specification. Specification names describe change lifecycle, not permanent capability vocabulary.

When a frontend feature consumes a backend capability, reference the related backend feature ID from the backend `docs/FEATURES.md`. Do not copy backend requirements into this repository unless the frontend needs a browser-specific refinement.

## Active tree

Keep the active tree shallow:

```text
active/
    spec-signal-harvester-web.md
    subspecs/
        <bounded-focus>.md
```

- the umbrella defines the frontend product target and durable browser requirements;
- a sub-spec defines one bounded implementation increment;
- only one sub-spec should be the current implementation focus;
- supporting specs should remain active only while they still define unresolved intended behavior.

Archived specs are historical records. Do not edit them during normal implementation or documentation cleanup.

## When to create a sub-spec

Create a bounded sub-spec when a change materially affects one or more of these areas:

- public browser behavior or navigation;
- backend contract consumption;
- live-data architecture or recovery semantics;
- authentication/authorization UX;
- cross-screen state or interaction architecture;
- testing/acceptance workflow;
- deployment/delivery behavior;
- a feature that spans multiple implementation sessions.

Small local fixes may be implemented directly when the owning architecture/current-state documentation already defines the behavior clearly.

## Lifecycle

1. Read the active umbrella before significant frontend work.
2. Identify the owning frontend feature IDs in `docs/FEATURES.md`.
3. Create or update the current bounded sub-spec when the change needs one.
4. Implement against explicit requirements and validation criteria.
5. Keep implemented-but-unverified work active with an explicit `verification-pending` status when appropriate.
6. After acceptance, move stable knowledge into current-state documentation.
7. Move the completed sub-spec to `archive/subspecs/`.
8. Update the umbrella `current_focus` and this index so the active tree stays consistent.
9. Archive the umbrella only when its overall product target is complete.

Archival is a move, not a copy. A specification must not exist in both active and archive locations.

## Document metadata

Managed documentation uses minimal YAML frontmatter:

- `type`;
- `title`;
- `description`.

Specifications additionally use workflow fields where useful:

- `document_role` — `umbrella` or `subspec`;
- `spec_status` — for example `active` or `verification-pending`;
- `parent` — umbrella path for a sub-spec;
- `current_focus` — current sub-spec path for an umbrella.

Do not add metadata that merely duplicates the document body or Git history.

## Writing structure

Optimize active specifications for precise model retrieval rather than aggressive brevity.

Use the sections that the change actually needs. A typical bounded spec is:

```text
# <Change name>

## Status
## Feature scope
## Goal
## Current state
## Requirements
## Processing sequence          # when order matters
## Failure semantics           # when failures need separate rules
## Scenarios                   # when examples remove ambiguity
## Non-goals
## Design constraints
## Compatibility / migration   # when contracts/state evolve
## Validation
## Implementation tasks        # when sequencing helps execution
```

Writing rules:

- use `must`, `must not`, `should`, and `may` consistently;
- keep requirement IDs stable while a spec is active;
- state browser/backend ownership explicitly;
- separate ordered sequences from invariants and validation rules;
- describe recovery, stale-data, and failure behavior explicitly when they affect the browser;
- preserve compatibility constraints and backend contract assumptions;
- prefer concrete routes, API operations, payload names, commands, and feature IDs;
- distinguish current state from intended change;
- do not shorten a requirement if the shorter text becomes easier to misinterpret.

## Active specifications

Umbrella:

- [`active/spec-signal-harvester-web.md`](active/spec-signal-harvester-web.md) — browser configuration, operations, Results, live updates, diagnostics, role-specific presentation, and delivery target.

Current implementation focus:

- [`active/subspecs/ui-performance-runtime-resilience.md`](active/subspecs/ui-performance-runtime-resilience.md) — `WEB.ROUTE_DELIVERY` and `WEB.BROWSER_VERIFICATION`; implementation complete, verification pending.

## Recently completed sub-specifications

- [`archive/subspecs/ui-responsive-large-data-hardening.md`](archive/subspecs/ui-responsive-large-data-hardening.md) — responsive/large bounded data containment, accepted on 2026-09-15.
- [`archive/subspecs/ui-targeted-visual-regression.md`](archive/subspecs/ui-targeted-visual-regression.md) — targeted reviewed visual regression, accepted on 2026-09-15.
- [`archive/subspecs/ui-accessibility-hardening.md`](archive/subspecs/ui-accessibility-hardening.md) — keyboard/focus/semantic accessibility hardening, accepted on 2026-09-15.
- [`archive/subspecs/ui-live-diagnostic-acceptance.md`](archive/subspecs/ui-live-diagnostic-acceptance.md) — real-backend Results/Event SSE and Processing Flow acceptance, accepted on 2026-09-15.
- [`archive/subspecs/ui-resilience-edge-case-testing.md`](archive/subspecs/ui-resilience-edge-case-testing.md) — reconnect, stale-link, partial-flow, keyboard, and narrow-viewport verification, accepted on 2026-09-15.
- [`archive/subspecs/ui-processing-flow-visualization.md`](archive/subspecs/ui-processing-flow-visualization.md) — backend-reconstructed run/item flow visualization, accepted on 2026-09-14.
- [`archive/subspecs/ui-live-results-event-explorer.md`](archive/subspecs/ui-live-results-event-explorer.md) — live Results and bounded Event Explorer, accepted on 2026-09-14.
- [`archive/subspecs/ui-monitoring-profiles-source-test.md`](archive/subspecs/ui-monitoring-profiles-source-test.md) — Monitoring Profiles, Source Test, and profile-driven manual Collection Runs, accepted on 2026-09-14.
- [`archive/subspecs/ui-browser-verification.md`](archive/subspecs/ui-browser-verification.md) — deterministic browser automation and bounded live-backend E2E, accepted on 2026-09-14.
