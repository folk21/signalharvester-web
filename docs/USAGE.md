---
type: Usage Guide
title: SignalHarvester Web usage
description: Current browser workflows for configuration, collection operations, Results, diagnostics, and repository verification.
---
# SignalHarvester Web usage

## Scope

This document describes how to use the current frontend after it is running. Installation prerequisites and local startup are owned by the root [`README.md`](../README.md).

The frontend authentication/session foundation is implemented and accepted against the backend security contract. Use a security-enabled backend for protected workflows; backend authorization remains authoritative.

## Authentication and roles

Open any protected route. Anonymous navigation redirects to `/login`; after a successful sign-in the browser re-reads the current principal from `/api/v1/auth/me`.

The frontend uses the backend's HttpOnly authentication cookie and does not expose the JWT to JavaScript. State-changing requests forward the readable signed `XSRF-TOKEN` cookie through `X-CSRF-TOKEN`, and Results/Event Observation SSE connections send browser credentials.

Roles are additive:

- `ADMIN` exposes configuration, operations, and diagnostic routes;
- `VIEWER` grants viewer Results access but does not imply `ADMIN`;
- the existing operational Results screen currently requires both `ADMIN` and `VIEWER`;
- a `VIEWER`-only principal receives a consumer-oriented relevant Results feed without ADMIN diagnostic detail;
- `USER` or `BOT` alone do not receive another browser capability implicitly.

A `401` from a protected request ends the frontend session and returns protected navigation to login. A `403` keeps the principal authenticated and displays an authorization error.

Use the sidebar **Sign out** action to call backend logout and clear cached application state.

## Identity Administration

Open `/users` with explicit `ADMIN`.

The screen lists persisted identities and supports creating a `HUMAN` or `BOT` identity plus replacing an existing identity's enabled state and explicit roles. Create passwords are never displayed after submission. Username and identity type are immutable in the edit form because the current backend API does not publish mutation operations for them.

Roles are additive and non-hierarchical. The form shows the backend baseline `USER` role for `HUMAN` identities and `BOT` role for `BOT` identities as required context, but the saved backend response remains authoritative.

If an update would disable or remove `ADMIN` from the last enabled administrator, the backend returns `409`; the UI shows that failure instead of trying to predict the invariant from its potentially stale list snapshot. There is currently no user deletion or password reset/change workflow in the frontend contract.


## Typical workflow

A representative current workflow is:

1. create or edit one or more Sources;
2. use **Test** on a persisted Source to verify fetch/extraction and inspect bounded preview items;
3. create a Monitoring Profile with category, interval, criteria, and ordered Source membership;
4. enable scheduled collection when desired;
5. start the profile manually from Collection Runs when immediate execution is useful;
6. inspect per-source/item run outcomes;
7. inspect Analysis Items when diagnosing normalization/deduplication state;
8. browse Results and keep the page open for live matching updates;
9. open one Result for content, analysis metadata, and provenance;
10. use Event Explorer for bounded technical history/live events;
11. open Processing Flow from a run, Result, or event to inspect backend-reconstructed stage evidence.

Use the backend repository's `tools/live-backend/` workflow when you need to distinguish a browser problem from a backend pipeline problem.

## Dashboard

Open `/` with explicit `ADMIN` for a bounded operational overview across Sources, Monitoring Profiles, Collection Runs, and Analysis. Results summaries are included only when the same principal also has explicit `VIEWER`.

Use the dedicated feature screens for complete actions and detailed inspection.

## Sources

Open `/sources`.

The screen supports listing, creating, editing, enabling/disabling, deleting, and diagnostically testing persisted Sources.

Source-specific settings are entered as a JSON string map because that is the current backend contract shape.

### Source Test

Choose **Test** on a persisted Source.

The backend uses the normal fetch/extraction boundary without publishing normal pipeline events or creating Collection Run history. The UI shows available diagnostic fields such as:

- HTTP status;
- response size/content type;
- fetch/extraction durations;
- candidate count;
- failure text;
- bounded extracted-item previews.

Disabled Sources may be tested. A successful preview does not mean that the items were inserted into Results.

Source management authorizes backend outbound access to configured destinations. The route is presented only to explicit `ADMIN`, but backend authorization and external-source destination policy remain the enforcement boundaries.

## Monitoring Profiles

Open `/profiles`.

A current Monitoring Profile contains:

- display name;
- information category;
- scheduled enabled/disabled state;
- collection interval in minutes;
- one or more ordered Source references;
- criteria as a string map entered as JSON.

The Source list shows each Source's type and enabled state. Existing membership order is preserved when unrelated profile fields are edited; newly selected Sources are appended.

A disabled profile may still be selected for a manual Collection Run. The enabled flag controls scheduled collection, not whether the persisted profile may be run manually.

Dedicated typed Analysis settings are not yet exposed by the current frontend contract.

## Collection Runs

Open `/runs`.

Select a persisted Monitoring Profile and choose **Start collection run**.

The browser sends only the selected profile identity. Information category and Source membership come from backend profile configuration.

Run detail exposes durable per-source/item outcomes returned by the backend.

RSS/Atom Sources may produce multiple semantic items from one fetched feed. Published counts and Source outcomes therefore describe extracted items rather than only successful HTTP responses.

## Analysis Items

Open `/analysis`.

This is a technical inspection view for normalized/deduplication state. It supports backend filters for Monitoring Profile and Source.

Use it when diagnosing why discoveries were accepted, deduplicated, or associated with a processing context. User-facing terminal analysis belongs to Results.

## Results

Open `/results`.

Principals with both explicit `ADMIN` and explicit `VIEWER` receive the operational Results presentation. Current operational filters are:

- Monitoring Profile ID;
- Source ID;
- information category;
- relevance;
- classification;
- analyzed-from time;
- analyzed-to time.

Selecting a row loads detail separately. Result detail includes normalized content, attributes, tags, analysis metadata, and event/correlation provenance.

The page opens backend SSE before loading its durable REST snapshot. Matching live updates then appear without manual refresh. A visible indicator shows live or reconnecting state.

Result detail can navigate to Event Explorer or the exact run/item Processing Flow when the required identifiers are available.

### Viewer Results

A `VIEWER` principal without `ADMIN` uses the same `/results` route with a consumer-oriented presentation. The browser reuses the existing Results REST/detail/SSE contracts and always requests `relevant=true` for the viewer feed.

The viewer filters are limited to information category and analyzed time range. Monitoring Profile ID, Source ID, classification, item/event/correlation/trace identifiers, and diagnostic filters are not presented.

Selecting a viewer Result shows consumer content such as title, category, source link, publication/analyzed times, summary/explanation, tags, normalized attributes, and normalized content. The viewer presentation does not render analyzer identity, internal provenance IDs, trace context, or links into Event Explorer and Processing Flow.

The viewer feed opens Results SSE before its durable snapshot using the same race-free synchronization behavior as the operational Results screen. New matching relevant Results appear without manual page refresh.

## Event Explorer

Open `/events`.

Event Explorer loads bounded retained technical history and follows new observed events through backend SSE.

Filters include backend-supported dimensions such as event type, producer, Kafka topic, correlation ID, Collection Run ID, item ID, and trace ID.

Selecting an event shows available Kafka position/key, trace/correlation context, producer/schema metadata, and decoded diagnostic payload.

This is a bounded backend projection, not direct Kafka history. Backend retention determines how much older data remains available.

## Processing Flow

Open `/flows`, or use **Open processing flow** from Collection Runs, Results, or Event Explorer.

Enter a Collection Run ID to inspect retained branches for that run. Add a raw or normalized Item ID to inspect one run-scoped branch. Equal item identities from different runs remain separate because the backend scopes reconstruction by Collection Run.

Each branch renders backend-provided stages in order. Stage cards show status, evidence classification, and timestamp when available. Connectors show edge kind and measured duration when available.

Select a stage to inspect available metadata such as:

- event type, producer, and event identity;
- raw/normalized Item identity;
- Source and Monitoring Profile;
- outcome and score;
- trace context;
- Kafka topic, partition, offset, and key.

`NOT OBSERVED`, partial-history state, and reconstruction limitations are intentional diagnostic information. The browser does not fill those gaps by inference. Processing Flow does not replace distributed tracing.

## Cross-check browser data against REST

Assuming the backend is running on `http://localhost:8080`, these calls use the same public boundaries as the browser:

```bash
curl -s http://localhost:8080/api/v1/sources | jq
curl -s http://localhost:8080/api/v1/monitoring-profiles | jq
curl -s -X POST http://localhost:8080/api/v1/sources/<SOURCE_ID>/test | jq
curl -s 'http://localhost:8080/api/v1/admin/collection-runs?limit=20' | jq
curl -s 'http://localhost:8080/api/v1/admin/analysis/items?limit=20' | jq
curl -s 'http://localhost:8080/api/v1/results?limit=20' | jq
```

For a Collection Run Processing Flow:

```bash
curl -s 'http://localhost:8080/api/v1/flows/collection-runs/<COLLECTION_RUN_ID>' | jq
```

For one run-scoped Item branch:

```bash
curl -s 'http://localhost:8080/api/v1/flows/collection-runs/<COLLECTION_RUN_ID>/items/<ITEM_ID>' | jq
```

For one Result detail, take `monitoringProfileId` and `normalizedItemId` from the Results list:

```bash
curl -s \
  'http://localhost:8080/api/v1/results/<NORMALIZED_ITEM_ID>?monitoringProfileId=<PROFILE_ID>' \
  | jq
```

## Deterministic browser verification

After installing Playwright Chromium with `npm run e2e:install`, run:

```bash
npm run e2e
```

The suite controls REST/SSE browser boundaries and can run while the backend is stopped. It covers navigation, configuration forms, Source Test, request construction, filters, details, async states, SSE browser behavior, accessibility, responsive/large-data edge cases, route loading/failure, and the reviewed visual baseline.

Run only the reviewed non-updating visual comparison with:

```bash
npm run e2e:visual
```

If an intentional UI change requires a new golden image:

```bash
npm run e2e:visual:update
```

Inspect the changed image and rerun `npm run e2e:visual`. Do not update visual baselines merely to silence an unexplained failure.

## Live-backend browser verification

With a real backend already running:

```bash
SIGNALHARVESTER_BACKEND_URL=http://127.0.0.1:8080 \
SIGNALHARVESTER_LIVE_USERNAME=<admin-viewer-user> \
SIGNALHARVESTER_LIVE_PASSWORD=<password> \
npm run e2e:live
```

The live workflow first authenticates through `/login`. The supplied test identity must explicitly have both `ADMIN` and `VIEWER`. It then creates a temporary deterministic RSS Source and Monitoring Profile, verifies Source Test, establishes Results SSE before a manual run, receives both fixture Results without refresh, keeps a durable Analysis check, establishes Event Observation SSE before a second run, receives a new correlated event without refresh, and follows a real Analysis event into item/full-run Processing Flow.

Cleanup removes the Monitoring Profile before the Source through the authenticated browser context and includes CSRF proof.

Run the backend with its security environment and test credentials. For a containerized or source-hardened backend, set `SIGNALHARVESTER_LIVE_FIXTURE_HOST` as needed and explicitly permit the deterministic fixture destination according to backend external-source security policy.

## Production route and asset verification

Primary screens are route-level chunks. After building, verify the production manifest and measured assets with:

```bash
npm run build
npm run build:assets
```

The asset command fails if an expected primary feature page is no longer a dynamic build entry. Raw/gzip sizes are informational until a reviewed numeric budget exists.

## Canonical repository gate

Run routine repository verification with:

```bash
./run_checks.sh
```

This regenerates OpenAPI types, typechecks application/browser-test code, runs Vitest and deterministic Playwright, builds the production frontend, verifies dynamic route entries, and reports production assets.

Live-backend E2E remains separate because this repository does not own backend infrastructure lifecycle.

## Browser troubleshooting

When a screen looks inconsistent, inspect the browser Network panel first.

Check:

- which `/api/...` request was sent;
- which query parameters or request body fields were included;
- what HTTP status came back;
- whether the JSON response matches what the page renders;
- whether the backend response itself is stale or unexpected.

In normal local development, Vite proxies `/api` to the backend configured by `VITE_DEV_PROXY_TARGET`.

## Current security status

The frontend implements the accepted browser authentication/session foundation, credentialed REST/SSE, CSRF forwarding, role-aware presentation, logout, explicit `401`/`403` handling, and ADMIN identity management.

Backend authorization and identity invariants remain authoritative. The frontend does not infer role hierarchy or decode the JWT. Cross-origin production hosting still requires an explicitly compatible backend CORS/cookie policy.
