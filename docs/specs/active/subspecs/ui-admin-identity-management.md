---
type: Specification
title: Frontend ADMIN identity management
description: Add ADMIN-oriented application identity list, creation, enabled-state, and explicit-role management over the backend security administration contract.
document_role: subspec
spec_status: verification-pending
parent: ../spec-signal-harvester-web.md
---
# Frontend ADMIN identity management

## Status

Verification-pending. Runtime code, documentation, deterministic browser coverage, and dynamic-route verification are implemented. Developer acceptance remains pending until the canonical repository gate passes.

## Feature scope

- `WEB.IDENTITY_ADMIN` — ADMIN identity list/create/update workflows.
- `WEB.AUTHORIZATION_UX` — ADMIN-only route/navigation presentation while backend authorization remains authoritative.
- `WEB.CONTRACT_INTEGRATION` — consume existing `UserAccount`, `UserCreateRequest`, and `UserUpdateRequest` schemas without redefining them.
- `WEB.BROWSER_VERIFICATION` — deterministic request-boundary and invariant-error coverage.
- `WEB.ROUTE_DELIVERY` — keep the new primary screen as a route-level dynamic entry.

Related backend feature IDs:

- `SECURITY.IDENTITY_ROLES`;
- `SECURITY.AUTHORIZATION`;
- `SECURITY.AUTHENTICATION`;
- `CONTRACTS.HTTP`.

## Goal

Give an authenticated principal with explicit `ADMIN` a browser workflow for managing persisted SignalHarvester identities through the existing backend `/api/v1/admin/users` contract.

The frontend must make identity type, enabled state, and explicit additive roles understandable while preserving backend ownership of normalization, uniqueness, credential hashing, and last-enabled-ADMIN invariants.

## Current state

The accepted security foundation already provides login/session bootstrap, cookie/CSRF transport, explicit additive role presentation, and ADMIN route guards.

The synchronized backend OpenAPI already exposes:

- `GET /api/v1/admin/users`;
- `POST /api/v1/admin/users`;
- `GET /api/v1/admin/users/{userId}`;
- `PUT /api/v1/admin/users/{userId}`;
- `UserAccount`, `UserCreateRequest`, and `UserUpdateRequest` schemas.

There is no delete, password-reset, password-change, self-service registration, or identity-type mutation endpoint in the current contract. The frontend must not invent one.

## Requirements

### I1 — ADMIN-only primary route

Feature: `WEB.IDENTITY_ADMIN`.

Add `/users` as a protected primary route presented only to explicit `ADMIN` principals. It must participate in the same authenticated shell and lazy route-loading model as other administrative screens.

A non-ADMIN deep link must be handled by the existing role guard and must not mount the identity-management screen.

### I2 — bounded identity list

Feature: `WEB.IDENTITY_ADMIN`.

Load persisted identities through `GET /api/v1/admin/users` and present at least:

- username and stable identity ID;
- identity type;
- enabled/disabled state;
- explicit returned role set;
- last-updated timestamp;
- an accessible edit action.

The browser may sort the returned list for presentation. It must not infer hidden role hierarchy or credential state.

### I3 — identity creation

Features: `WEB.IDENTITY_ADMIN`, `WEB.CONTRACT_INTEGRATION`.

Creation must use `POST /api/v1/admin/users` with the OpenAPI-derived `UserCreateRequest` shape:

- username;
- password;
- `HUMAN` or `BOT` identity type;
- enabled state;
- explicit role assignments.

Password input must remain page-local form state. It must not enter query cache, Web Storage, URL state, logs, list rows, or persisted frontend state.

The form may reflect the documented backend baseline-role invariant (`USER` for `HUMAN`, `BOT` for `BOT`) to reduce confusing submissions, but backend normalization remains authoritative.

### I4 — identity updates

Feature: `WEB.IDENTITY_ADMIN`.

Editing must use `PUT /api/v1/admin/users/{userId}` and replace only the fields published by `UserUpdateRequest`:

- enabled state;
- roles.

Username, identity type, and password must be visibly immutable in the edit workflow because the backend does not publish mutation operations for them.

### I5 — additive role semantics

Features: `WEB.IDENTITY_ADMIN`, `WEB.AUTHORIZATION_UX`.

The UI must preserve additive, non-hierarchical role semantics:

- `ADMIN` must not imply `VIEWER`;
- `VIEWER` must not imply `ADMIN`;
- baseline `USER`/`BOT` roles must not be presented as evidence of operational access.

Role controls may show the backend-required baseline role for the selected identity type as required/read-only browser context. The saved backend response remains the source of truth for the actual normalized role set.

### I6 — backend invariant/error handling

Feature: `WEB.IDENTITY_ADMIN`.

Backend failures must remain explicit. In particular:

- `409` duplicate username on creation must be shown as a request failure;
- `409` when an update would remove or disable the last enabled `ADMIN` must be shown without pretending the update succeeded;
- `400`, `401`, and `403` continue to use the shared HTTP/session behavior.

The frontend must not attempt to reproduce the backend's transactional last-enabled-ADMIN calculation from a potentially stale list snapshot.

### I7 — accessibility and bounded layout

Features: `WEB.IDENTITY_ADMIN`, `WEB.ACCESSIBILITY`, `WEB.RESPONSIVE_LAYOUT`.

The identity table and form must use semantic native controls, accessible names for repeated edit actions, explicit form errors, and the existing bounded configuration layout conventions.

Entering edit mode should focus the form, and cancellation should restore focus to the originating edit action when practical.

### I8 — deterministic browser verification

Feature: `WEB.BROWSER_VERIFICATION`.

Backend-independent Playwright coverage must verify at least:

1. ADMIN navigation can reach the identity screen;
2. create request construction, including CSRF proof and password presence only in the create payload;
3. update request construction contains only enabled state and roles;
4. immutable edit fields are not offered as mutations;
5. a backend `409` last-enabled-ADMIN rejection remains visible and leaves the edit workflow recoverable.

Tests must assert browser/request boundaries rather than recreate backend persistence or authorization logic.

### I9 — production route verification

Feature: `WEB.ROUTE_DELIVERY`.

`UserAdministrationPage` must remain a dynamic Vite route entry and be added to the repository's production manifest verification list.

## Non-goals

This stage does not add:

- user deletion;
- password reset/change workflows;
- MFA or external identity-provider federation;
- immediate revocation of already-issued JWTs;
- role hierarchy;
- BOT-specific business permissions;
- viewer Results redesign.

## Validation

The stage is ready for acceptance when:

- `npm run api:generate` succeeds against the checked-in OpenAPI snapshot;
- `npm run typecheck` succeeds;
- deterministic identity-management Playwright scenarios pass;
- the full `npm run e2e` suite passes;
- production build/asset verification includes the new dynamic route;
- `./run_checks.sh` passes.
