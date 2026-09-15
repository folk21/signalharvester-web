---
type: Specification
title: Responsive and large-data UI hardening
description: Keep configuration, Result detail, and Processing Flow usable across narrow/tablet layouts and larger bounded datasets without inventing unsupported pagination semantics.
document_role: subspec
spec_status: completed
parent: ../spec-signal-harvester-web.md
---
# Responsive and large-data UI hardening

## Status

Completed and accepted after developer verification.

## Goal

Strengthen the existing responsive baseline for realistic operational data sizes and long values while preserving backend-owned bounds and contracts.

This slice focuses on layout containment and navigation ergonomics rather than adding client-side pagination, virtualization, or another component framework.

## Relationship to the umbrella specification

This slice advances the usability side of `UI-R17` and the resilience goals of `UI-R18`. It extends the accepted narrow diagnostic regression to configuration collections, long Result detail values, and many-branch Processing Flow reconstruction.

## Requirements

### R1 — bounded configuration collections

Sources and Monitoring Profiles must remain usable when the backend returns dozens of rows. Their table regions may scroll locally, with headers remaining visible, instead of forcing the entire page to grow without bound.

The frontend must not truncate the returned collection or invent client-side pagination semantics that the backend contract does not expose.

### R2 — large source membership editing

The Monitoring Profile source-membership control must remain usable with dozens of configured sources. The membership list must have a bounded scroll region while preserving native checkbox navigation and the existing ordered-membership behavior.

Long source names must wrap within that region rather than widening the document.

### R3 — narrow configuration layouts

At a 320 px viewport, configuration tables may use local horizontal scrolling when their tabular structure cannot remain readable in one column, but the document itself must not develop horizontal overflow.

Long Source/Profile names and identifiers must remain contained.

### R4 — long Result detail values

Long tags, explanation text, attributes, URLs, identifiers, and normalized content must wrap or scroll within their owning detail surfaces. Tablet layouts must not acquire page-level horizontal overflow from unbroken values.

### R5 — many Processing Flow branches

A run flow with many backend-provided branches must remain navigable without creating an excessively tall graph region. Branches may use a bounded vertical scroll surface while each branch keeps its existing local horizontal stage-track scroll.

On phone-sized layouts, avoid stacked nested vertical scroll regions and allow the branch list to participate in normal page scrolling.

### R6 — deterministic browser verification

The routine Playwright suite must cover:

- at least one 320 px configuration scenario with dozens of Sources/Profiles and long names;
- locally bounded configuration table and source-membership scrolling;
- long Result tags/content on a tablet viewport without document overflow;
- a many-branch Processing Flow at tablet width with local vertical branch scrolling and local horizontal track scrolling;
- preservation of all backend-returned rows rather than frontend truncation.

## Non-goals

This slice does not:

- add backend pagination or cursor contracts;
- add client-side pagination that changes backend semantics;
- add table virtualization;
- introduce a component framework;
- change backend result/event/flow bounds;
- redesign the application navigation model;
- claim general performance scalability for arbitrarily large datasets.

## Acceptance criteria

This slice is accepted when:

- the new responsive/large-data Playwright scenarios pass;
- the existing resilience, accessibility, and visual-regression browser checks continue to pass;
- no reviewed visual baseline requires an unintentional update;
- `./run_checks.sh` passes;
- a manual 320 px spot-check confirms configuration controls remain usable and scrolling is confined to the intended regions.
