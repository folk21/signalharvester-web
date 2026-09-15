---
type: Specification Guide
title: Frontend change specifications
description: SignalHarvester Web specification hierarchy, lifecycle, and relationship to backend product contracts.
---
# Frontend change specifications

`docs/specs/` contains significant planned or in-progress frontend changes. A specification defines intended behavior and acceptance targets. It is not canonical evidence of what the repository already implements.

Current implementation truth belongs in:

- [`../ARCHITECTURE.md`](../ARCHITECTURE.md);
- [`../IMPLEMENTATION.md`](../IMPLEMENTATION.md);
- [`../USAGE.md`](../USAGE.md).

The backend repository owns cross-project product requirements and backend REST/SSE contracts. This repository owns React/browser behavior and frontend implementation choices. Frontend specs may refine a backend product requirement but must not silently redefine backend wire contracts.

## Specification hierarchy

Keep the active tree shallow:

```text
active/
    spec-signal-harvester-web.md
    subspecs/
        <bounded-focus>.md
```

- the active umbrella defines the frontend product target;
- a sub-spec defines one bounded implementation increment;
- only one sub-spec should be the current implementation focus;
- supporting specs should remain active only while they still define unresolved intended behavior.

## Lifecycle

1. Read the active umbrella before significant frontend work.
2. Create a sub-spec when work changes public behavior, contract consumption, live-data architecture, testing workflow, security, or spans multiple implementation sessions.
3. Implement against explicit acceptance criteria.
4. Move accepted stable knowledge into current-state documentation.
5. Move completed sub-specs to `archive/subspecs/`.
6. Archive the umbrella only when its product target is complete.

Archived specs are historical. Ignore them during normal implementation unless explicitly requested.

## Document metadata

Managed documentation uses minimal YAML frontmatter:

- `type`;
- `title`;
- `description`.

Specification files additionally use workflow fields where useful:

- `document_role` — `umbrella` or `subspec`;
- `spec_status` — for example `active` or `verification-pending`;
- `parent` — umbrella path for a sub-spec;
- `current_focus` — current sub-spec path for an umbrella.

Do not add metadata that merely duplicates the body or Git history.

## Active specifications

Umbrella:

- [`active/spec-signal-harvester-web.md`](active/spec-signal-harvester-web.md) — browser configuration, operations, Results, live updates, and diagnostic UI target.

Current implementation focus:

- [`active/subspecs/ui-accessibility-hardening.md`](active/subspecs/ui-accessibility-hardening.md) — native semantics, keyboard focus management, accessible repeated-action names, and deterministic accessibility-oriented browser verification; implementation complete, verification pending.

Active supporting track:

- [`active/subspecs/ui-targeted-visual-regression.md`](active/subspecs/ui-targeted-visual-regression.md) — reviewed Playwright golden-image coverage for high-signal layout regressions; implementation complete, verification pending.

Recently completed:

- [`archive/subspecs/ui-live-diagnostic-acceptance.md`](archive/subspecs/ui-live-diagnostic-acceptance.md) — real-backend Results SSE, Event Observation SSE, and Processing Flow browser acceptance, accepted on 2026-09-15.

- [`archive/subspecs/ui-resilience-edge-case-testing.md`](archive/subspecs/ui-resilience-edge-case-testing.md) — keyboard, reconnect, bounded-history, partial-flow, and narrow-viewport resilience verification, accepted on 2026-09-15.

- [`archive/subspecs/ui-processing-flow-visualization.md`](archive/subspecs/ui-processing-flow-visualization.md) — run/item processing-flow visualization over the backend reconstruction API, accepted on 2026-09-14.

- [`archive/subspecs/ui-live-results-event-explorer.md`](archive/subspecs/ui-live-results-event-explorer.md) — live Results SSE and bounded Event Explorer history/live delivery, accepted on 2026-09-14.
- [`archive/subspecs/ui-monitoring-profiles-source-test.md`](archive/subspecs/ui-monitoring-profiles-source-test.md) — Monitoring Profiles, Source Test, and profile-driven manual Collection Runs, accepted on 2026-09-14.
- [`archive/subspecs/ui-browser-verification.md`](archive/subspecs/ui-browser-verification.md) — deterministic browser automation and one bounded live-backend E2E workflow, accepted on 2026-09-14.
