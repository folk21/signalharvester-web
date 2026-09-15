---
type: Specification
title: UI accessibility hardening
description: Strengthen native browser semantics, keyboard focus behavior, accessible control naming, and deterministic accessibility-oriented Playwright coverage.
document_role: subspec
spec_status: verification-pending
parent: ../spec-signal-harvester-web.md
---
# UI accessibility hardening

## Status

Implementation complete. Developer verification pending.

## Goal

Build on the accepted keyboard row-selection coverage with a focused accessibility slice that improves native semantics and keyboard focus behavior without adding a new accessibility framework or component dependency.

This slice protects browser-visible behavior that can be verified deterministically with semantic Playwright locators. It does not attempt to replace a later standards audit or automated WCAG scanner.

## Relationship to the umbrella specification

This slice advances `UI-R17` by making the application shell, configuration workflows, async states, and repeated table actions more understandable to keyboard and assistive-technology users while keeping the existing React/TanStack Query architecture unchanged.

## Requirements

### R1 — keyboard bypass for repeated navigation

The application shell must expose a first-focusable `Skip to main content` link that transfers focus to the main content landmark without changing routes or requiring pointer input.

### R2 — stable semantic landmarks and named regions

The existing main navigation and main content landmarks must remain discoverable through native semantic HTML. Core configuration/filter forms and data tables should expose useful accessible names where the surrounding visual heading is otherwise not programmatically associated with the element.

### R3 — distinguish repeated row actions

Repeated row actions such as Source and Monitoring Profile edit/delete/toggle/test controls must include the affected entity in their accessible names. Visible button text may stay compact.

### R4 — predictable form focus

Starting a new Source/Profile or editing an existing one must move keyboard focus to the first form field. Cancelling an edit must restore focus to the action that opened that edit when it still exists.

### R5 — semantic async and validation state

Loading state must use non-interruptive status semantics. Request failures, mutation failures, and client validation failures must be exposed as alerts so error presentation does not depend only on color or visual placement.

Live connection state changes should be exposed as polite status updates rather than requiring a user to inspect the page visually.

### R6 — deterministic browser verification

The routine Playwright suite must verify:

- skip-link keyboard behavior and main-content focus;
- named navigation/main/form/table semantics for representative screens;
- distinct accessible names for repeated configuration actions;
- edit/cancel focus restoration for Source and Monitoring Profile workflows;
- semantic loading/request-failure/client-validation states.

The checks must remain backend-independent and must not add an accessibility dependency in this slice.

## Non-goals

This slice does not:

- claim WCAG conformance;
- add axe-core or another accessibility scanner;
- perform a complete color-contrast audit;
- redesign responsive layouts;
- add modal/dialog primitives that the current UI does not use;
- change backend contracts or business validation.

## Acceptance criteria

This slice is accepted when:

- the application shell exposes a working keyboard skip link;
- repeated Source/Profile row actions have entity-specific accessible names;
- configuration edit/cancel workflows demonstrate deterministic focus entry and restoration;
- loading, request failures, and client validation expose native status/alert semantics;
- the added accessibility-oriented Playwright checks pass as part of the normal deterministic suite;
- `./run_checks.sh` passes.
