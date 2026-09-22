---
type: Specification
title: All-relevant Analysis UX and Source delete feedback
description: Bounded frontend change for explicit all-relevant Monitoring Profile settings, clearer Analysis/criteria separation, and tested Source deletion behavior.
document_role: subspec
spec_status: verification-pending
parent: ../spec-signal-harvester-web.md
---
# All-relevant Analysis UX and Source delete feedback

## Status

Implementation is complete and verification is pending.

## Feature scope

- `WEB.MONITORING_PROFILES`
- `WEB.SOURCE_CONFIGURATION`
- `WEB.BROWSER_VERIFICATION`
- backend `CONFIGURATION.MONITORING_PROFILES`
- backend `ANALYSIS.CLASSIFICATION`
- backend `CONFIGURATION.SOURCES`

## Goal

Make the browser reflect the backend's explicit all-relevant Analysis semantics and remove two confusing configuration behaviors discovered during live manual acceptance:

- users must not need artificial broad keywords to make Results visible to VIEWER users;
- Source deletion failures caused by Monitoring Profile references must be explained at the delete action surface.

## Requirements

### UI-AR1 — keyword filtering is opt-in

The Monitoring Profile form must expose keyword filtering as an explicit checkbox. When it is disabled, the request must send effective all-relevant settings `{ "keywords": [], "minimumMatches": 0 }`.

Editing an existing all-relevant profile must initialize the checkbox as disabled. Editing a keyword-filtered profile must allow the filter to be disabled and saved.

### UI-AR2 — criteria remain separate

The generic `criteria` JSON editor remains a `Record<string,string>`. The UI must explain that it is separate from Analysis settings and that every criteria value must be a string. Typed Analysis settings must not be entered through the criteria editor.

### UI-AR3 — replacement writes preserve effective settings

Enabled/disabled replacement PUTs must continue round-tripping the backend-provided effective settings, including `{ "keywords": [], "minimumMatches": 0 }`.

### UI-SD1 — successful Source delete

The deterministic browser suite must confirm that accepting the delete confirmation sends `DELETE /api/v1/sources/{sourceId}`, handles `204`, refreshes the source list, and removes the row.

### UI-SD2 — referenced Source conflict

When Source delete returns backend `409`, the Source must remain visible and the browser must show an action-local message explaining that the Source is still referenced by a Monitoring Profile and must be removed there first.

The frontend must not infer source-reference ownership from a potentially stale local snapshot instead of the backend response.

## Validation

- Vitest covers all-relevant form mapping/validation and replacement payload preservation.
- Deterministic Playwright covers Source delete success and `409` conflict UX.
- Monitoring Profile Playwright covers create/edit transitions between all-relevant and keyword-filtered states.
- Live Playwright creates a profile without artificial keyword filters and expects effective `[]/0` settings from the real backend.
- Run `./run_checks.sh` and then `npm run e2e:live` against the patched backend before acceptance.
