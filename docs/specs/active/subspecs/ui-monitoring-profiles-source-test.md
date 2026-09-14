---
type: Specification
title: Monitoring profile and source-test UI
summary: Add persisted monitoring-profile configuration, source diagnostics, and profile-driven manual collection to the frontend.
document_role: subspec
spec_status: verification-pending
parent: ../spec-signal-harvester-web.md
---
# Monitoring profile and source-test UI

## Status

Implementation complete. Verification pending.

## Goal

Bring the configuration and manual collection UI into alignment with the current backend contract.

This slice adds persisted monitoring profiles, bounded source-test diagnostics, and profile-driven manual Collection Runs. It does not add live Results or event diagnostics; those belong to the next frontend slice.

## Backend contracts

This slice consumes backend-owned contracts from the checked-in OpenAPI snapshot:

- `GET/POST /api/v1/monitoring-profiles`;
- `GET/PUT/DELETE /api/v1/monitoring-profiles/{profileId}`;
- `POST /api/v1/sources/{sourceId}/test`;
- `POST /api/v1/admin/collection-runs` with `monitoringProfileId` only.

The frontend must not duplicate backend scheduling, source-membership, source-test, or collection semantics.

## UI behavior

### Monitoring Profiles

Add a `/profiles` screen in the existing application shell.

The screen must support:

- listing persisted profiles;
- creating a profile;
- editing a profile;
- enabling or disabling scheduled collection;
- deleting a profile;
- editing information category;
- editing the collection interval in minutes;
- assigning one or more configured sources;
- preserving ordered source membership when an existing profile is edited without changing membership;
- editing the backend criteria string map as JSON.

The UI must show enough source context to distinguish enabled and disabled sources.

### Source Test

The existing Sources screen must expose a `Test` action for persisted sources, including disabled sources.

A successful diagnostic response must show, when supplied by the backend:

- diagnostic status;
- HTTP status;
- response size and content type;
- fetch duration;
- extraction duration;
- candidate count;
- failure text;
- bounded extracted-item previews.

Source Test must remain a diagnostic operation. The frontend must not imply that preview items were inserted into normal Results.

### Manual Collection Runs

The Collection Runs screen must stop asking the user for an arbitrary category or profile identifier.

It must:

- load persisted monitoring profiles;
- let the user select a profile by readable name;
- send only the selected `monitoringProfileId` to the backend;
- use backend-returned profile/category context when rendering run history;
- allow manual execution of a persisted profile independently of whether its automatic schedule is enabled.

If no profiles exist, the screen must explain that a profile must be created first.

## State ownership

TanStack Query continues to own source, profile, and run server state.

Form state, source-test presentation state, and current selections remain local React state.

Do not add a second global state store.

## Verification

Deterministic browser coverage must verify:

- navigation to Monitoring Profiles;
- monitoring-profile create request construction;
- source membership and criteria submission;
- Source Test request and bounded diagnostic rendering;
- manual Collection Run request containing only `monitoringProfileId`.

The opt-in live browser workflow must use the real configuration model:

1. create a temporary RSS source;
2. test the source;
3. create a temporary monitoring profile referencing that source;
4. run the monitoring profile manually;
5. inspect Analysis and Results;
6. delete the monitoring profile before deleting the source.

## Acceptance criteria

This slice is accepted when:

- the checked-in OpenAPI snapshot reflects the current backend contract;
- generated TypeScript types can be regenerated without handwritten DTOs;
- `./run_checks.sh` passes;
- the updated opt-in `npm run e2e:live` passes against a compatible backend;
- current-state documentation describes Monitoring Profiles and Source Test as implemented;
- live Results, Event Explorer, and flow visualization remain explicitly future frontend work.
