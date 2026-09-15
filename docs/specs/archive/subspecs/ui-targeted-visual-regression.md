---
type: Specification
title: Targeted UI visual regression
description: Add a small reviewed Playwright golden-image baseline for high-signal layout regressions without turning every screen into a screenshot test.
document_role: subspec
spec_status: completed
parent: ../spec-signal-harvester-web.md
---
# Targeted UI visual regression

## Status

Completed and accepted after developer verification.

## Goal

Add visual regression coverage for UI defects that semantic DOM assertions do not detect well, such as accidental panel movement, large spacing changes, missing visual hierarchy, and broken dense-screen composition.

Keep the coverage deliberately small. Visual snapshots are expensive to review and can become noisy when they are applied to every state.

## Initial reviewed baseline

The first golden baseline covers the populated Results screen with a selected Result detail.

This screen is the initial target because it combines:

- the application shell and navigation;
- a dense table;
- live connection state;
- selected-row treatment;
- a detail panel;
- action buttons and diagnostic metadata.

The baseline uses deterministic mocked backend responses and a fixed viewport, device scale factor, locale, and timezone. It does not depend on a running backend or current production data.

The reviewed image is stored under `tests/e2e/__screenshots__/` and is exercised by the normal deterministic `npm run e2e` suite.

## Stability policy

Visual comparison must remain robust enough for developer machines while still detecting material layout changes.

The Playwright comparison therefore:

- disables animations;
- hides the caret;
- uses a bounded pixel-difference tolerance;
- uses a platform-independent snapshot path;
- fixes viewport, device scale factor, locale, and timezone in the visual test.

Do not increase the tolerance merely to accept an unexplained difference. First inspect the Playwright actual/diff output and determine whether the change is intentional or environmental.

## Updating a baseline

Routine verification must never update golden files automatically.

When a visual change is intentional:

1. run the dedicated visual update command;
2. inspect the changed PNG rather than accepting it blindly;
3. run the focused visual comparison without updating snapshots;
4. run the normal repository verification gate;
5. commit the reviewed baseline together with the intended UI change.

## Expansion rule

Add another golden only when it protects a distinct, stable layout risk that is not already covered well by semantic browser assertions.

Good future candidates are:

- Event Explorer with selected event detail;
- complete and partial Processing Flow layouts;
- Monitoring Profile editing when that form stabilizes further;
- one narrow mobile composition if its responsive structure becomes a frequent regression source.

Do not create screenshots for every loading, error, filter, or mutation state. Those remain better protected by deterministic semantic assertions.

## Non-goals

This slice does not:

- replace semantic Playwright assertions;
- make live-backend E2E depend on screenshot comparison;
- validate backend data or SSE ordering;
- introduce a new visual-testing service or framework;
- automatically approve updated screenshots.

## Acceptance criteria

This slice is accepted when:

- the canonical populated Results/detail golden is versioned in the repository;
- normal `npm run e2e` compares the page against that golden;
- intentional baseline updates require an explicit command;
- Playwright produces actual/diff artifacts on mismatch;
- the previous UI resilience slice is archived after its successful verification;
- `./run_checks.sh` passes without updating snapshots.
