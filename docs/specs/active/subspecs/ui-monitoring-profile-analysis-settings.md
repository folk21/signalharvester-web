---
type: Specification
title: Monitoring Profile Analysis settings
description: Contract-gated frontend slice for typed Monitoring Profile Analysis settings without inventing hidden criteria-map conventions.
document_role: subspec
spec_status: blocked
parent: ../spec-signal-harvester-web.md
---
# Monitoring Profile Analysis settings

## Status

Blocked on the backend contract. The current checked-in OpenAPI schema exposes Monitoring Profile identity, category, enabled state, collection interval, ordered source membership, and the generic `criteria` string map, but it does not expose profile-owned Analysis settings.

No runtime frontend implementation is allowed until the backend publishes the typed settings contract and the frontend OpenAPI snapshot is synchronized.

## Feature scope

- `WEB.MONITORING_PROFILES` — extend the existing Monitoring Profile create/edit workflow with typed Analysis settings.
- `WEB.CONTRACT_INTEGRATION` — consume the backend-published OpenAPI schema rather than defining handwritten Analysis DTOs.
- `WEB.BROWSER_VERIFICATION` — verify create/edit/default/error and preservation behavior deterministically.

Related backend feature IDs:

- `CONFIGURATION.MONITORING_PROFILES`;
- `ANALYSIS.CLASSIFICATION`;
- `CONTRACTS.HTTP`.

## Goal

Complete the Monitoring Profile configuration surface required by the initial product without hiding Analysis behavior inside the existing generic `criteria` map.

The browser should present settings that the backend explicitly owns, persists, validates, and uses for deterministic Analysis. The frontend must not infer a schema from current backend configuration properties or from implementation details that are absent from OpenAPI.

## Current state and blocker

The current Monitoring Profile form owns:

- name;
- information category;
- enabled/scheduled state;
- collection interval;
- ordered source membership;
- generic string-map criteria.

`MonitoringProfile` and `MonitoringProfileUpsertRequest` in the checked-in OpenAPI snapshot do not contain a typed Analysis-settings property. The current generated TypeScript aliases therefore provide no authoritative Analysis-settings shape for the browser.

The existing backend snapshot still describes deterministic keyword rules as temporary global configuration until Monitoring Profiles own Analysis settings. That backend refinement must land first.

## Contract entry gate

Implementation may start only when all of the following are true:

1. the backend OpenAPI schema exposes profile-owned Analysis settings on Monitoring Profile reads and create/update requests;
2. backend persistence and validation own those settings;
3. backend Analysis behavior consumes the profile-owned settings for newly processed work according to its documented semantics;
4. the frontend `openapi/signalharvester-v1.yaml` snapshot has been replaced with that contract;
5. `npm run api:generate` produces the corresponding types without handwritten transport DTOs.

If the backend chooses a shape different from current temporary keyword configuration, this specification follows the published contract. The frontend must not preserve assumptions about keywords, thresholds, defaults, or optionality that the contract does not define.

## Requirements

### A1 — OpenAPI-derived settings model

Features: `WEB.MONITORING_PROFILES`, `WEB.CONTRACT_INTEGRATION`.

Analysis-settings values and request shapes must come from generated OpenAPI types or aliases derived from them.

Do not add a handwritten duplicate REST DTO, hidden `criteria` keys, or stringly typed compatibility object merely to begin the UI before the contract exists.

### A2 — separate Analysis controls from search criteria

Feature: `WEB.MONITORING_PROFILES`.

When the typed contract exists, the Monitoring Profile form must render Analysis settings as their own configuration section. The existing generic `criteria` map remains a separate product concept and must not become an undocumented transport for Analysis configuration.

Control type, optionality, range, list semantics, and defaults must follow the backend schema. Do not invent frontend-only defaults that change an omitted backend value into an explicit setting.

### A3 — create and edit round-trip fidelity

Features: `WEB.MONITORING_PROFILES`, `WEB.CONTRACT_INTEGRATION`.

Create requests must send the Analysis settings represented by the form according to the backend request schema.

Edit must initialize controls from the persisted Monitoring Profile response and preserve values that the user does not change.

The frontend must preserve the distinction between an omitted setting, an empty collection/value, and an explicit backend-defined value whenever the OpenAPI contract makes that distinction observable.

### A4 — non-form mutations preserve Analysis settings

Feature: `WEB.MONITORING_PROFILES`.

Existing convenience mutations that replace a Monitoring Profile, including enabled/disabled toggles, must preserve the persisted Analysis settings.

When the backend request remains replacement-style `PUT`, helper code that reconstructs `MonitoringProfileUpsertRequest` from a persisted profile must include every mutable contract field required to avoid resetting Analysis behavior accidentally.

This requirement must receive deterministic regression coverage because it can be missed when a new field is added to an existing replacement request.

### A5 — validation remains backend-authoritative

Features: `WEB.MONITORING_PROFILES`, `WEB.CONTRACT_INTEGRATION`.

The browser should provide immediate validation for constraints that are explicit in the generated contract and practical to enforce locally.

Backend validation remains authoritative. Backend `400` responses must be surfaced as form/mutation errors rather than replaced with a second frontend business-rule implementation.

### A6 — deterministic browser coverage

Feature: `WEB.BROWSER_VERIFICATION`.

Deterministic verification must cover at least:

- create with typed Analysis settings;
- edit and persisted-value initialization;
- change and save;
- unchanged-value preservation;
- enabled/disabled toggle preservation under replacement `PUT` semantics;
- backend validation failure presentation;
- the existing Monitoring Profile criteria behavior remaining independent.

Tests must assert the REST payload shape rather than only checking rendered labels.

### A7 — current workflows remain stable

Feature: `WEB.MONITORING_PROFILES`.

Source ordering, collection interval, category, enabled state, generic criteria, focus management, responsive containment, and existing async/error behavior must remain intact.

This slice must not introduce a second Monitoring Profile screen or a separate client-state owner.

## Non-goals

This stage does not:

- define the backend Analysis-settings schema;
- encode temporary backend configuration-property names into the browser;
- change Analysis algorithms or scoring semantics;
- move backend validation into React;
- add category-specific Results presentation;
- add Results pagination/search;
- reinterpret the existing generic `criteria` map as Analysis configuration.

## Validation after the contract exists

The implementation is ready for acceptance when:

- the frontend OpenAPI snapshot matches the backend contract;
- generated TypeScript types include the profile-owned Analysis settings;
- focused unit tests cover any form/payload transformation introduced by the contract;
- deterministic Playwright covers A6, including toggle preservation;
- `./run_checks.sh` passes;
- an optional real-backend browser run demonstrates that saved profile settings round-trip through the authoritative API and affect newly processed work as defined by the backend.
