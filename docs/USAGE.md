---
type: Usage Guide
title: SignalHarvester Web usage
description: Current UI workflows for configuration, collection operations, Results, live event diagnostics, and processing-flow inspection.
---
# SignalHarvester Web usage

## Scope

This document describes how to use the current frontend after it is running. Installation, prerequisites, and local startup remain in the root [`README.md`](../README.md).

The current build has no authentication. Use it only with a trusted local/private backend.

## Typical workflow

A useful current workflow is:

1. create or edit one or more Sources;
2. use **Test** on a persisted Source to verify fetch/extraction and inspect bounded preview items;
3. create a Monitoring Profile with category, interval, criteria, and ordered source membership;
4. enable scheduled collection when desired;
5. start the Monitoring Profile manually from Collection Runs when immediate execution is useful;
6. inspect per-source run outcomes;
7. inspect normalization/deduplication state when diagnosing processing;
8. browse analyzed Results and keep the page open for live matching updates;
9. open one Result to inspect content, analysis metadata, and provenance;
10. open Event Explorer for bounded technical history and live processing events;
11. open Processing Flow from a run, result, or event to inspect the reconstructed stage path and evidence.

The backend repository's `tools/live-backend/` workflow remains useful when you need to distinguish a frontend problem from a backend pipeline problem.

## Dashboard

Open `/`.

The Dashboard shows bounded recent information from Sources, Monitoring Profiles, Collection Runs, Analysis, and Results.

Use the dedicated screens for complete actions and details.

## Sources

Open `/sources`.

The screen supports:

- listing configured sources;
- creating a source;
- editing source fields;
- enabling/disabling collection for a source;
- deleting a source;
- diagnostically testing a persisted source.

Source settings are entered as a JSON string map because that is the backend contract shape.

### Source Test

Choose **Test** on a persisted source. The backend uses the normal fetch/extraction boundary without publishing normal pipeline events or creating collection-run history.

The UI shows available diagnostic fields including HTTP status, response size/content type, fetch/extraction durations, candidate count, failure text, and bounded extracted-item previews.

Testing is allowed for disabled sources. A successful preview does not mean that the items were inserted into Results.

A configured source can authorize outbound backend HTTP access to its destination. Do not expose source management to untrusted users while the application has no authentication/authorization and before backend outbound-destination policy is hardened.

## Monitoring Profiles

Open `/profiles`.

A Monitoring Profile currently contains:

- a display name;
- information category;
- enabled/disabled scheduled state;
- collection interval in minutes;
- one or more ordered Source references;
- a criteria string map entered as JSON.

The source list shows each source's type and enabled state. Selection order is preserved as profile source order; newly selected sources are appended.

A disabled profile may still be selected for a manual Collection Run. The enabled flag controls scheduled collection rather than whether the persisted profile exists.

## Collection Runs

Open `/runs`.

Select a persisted Monitoring Profile and choose **Start collection run**. The browser sends only the selected profile identity. Information category and source membership come from the backend profile configuration.

Run detail exposes durable per-source/item outcomes returned by the backend.

RSS/Atom sources may produce multiple published semantic items from one fetched feed. Published counts and source outcomes therefore describe extracted items rather than merely successful HTTP responses.

## Analysis Items

Open `/analysis`.

This screen is a technical inspection view for normalized/deduplication state. It supports the backend filters for monitoring profile and source.

Use this screen when diagnosing why raw discoveries were accepted, deduplicated, or associated with a particular processing context. User-facing terminal analysis belongs to Results.

## Results

Open `/results`.

The current filters are:

- monitoring profile ID;
- source ID;
- information category;
- relevance;
- classification;
- analyzed-from time;
- analyzed-to time.

Selecting a list row loads the detailed representation separately. Detail includes normalized content, attributes, tags, analysis metadata, and event/correlation provenance.

The Results page opens the backend SSE stream before loading its durable REST snapshot. Matching live updates then appear without manual refresh. A visible connection indicator shows live or reconnecting state. Result detail can open Event Explorer or the exact run/item Processing Flow.

## Event Explorer

Open `/events`.

The Event Explorer loads bounded retained history and then follows new observed events through backend SSE. Filters include event type, producer, Kafka topic, correlation ID, Collection Run ID, item ID, and trace ID. Selecting an event shows Kafka position/key, trace/correlation context, producer/schema metadata, and the decoded diagnostic payload.

This is a bounded backend projection, not direct Kafka history. Backend retention determines how much older data remains available. Event detail can open the related run/item Processing Flow when item identity is available.


## Processing Flow

Open `/flows`, or use **Open processing flow** from Collection Runs, Results, or Event Explorer.

Enter a Collection Run ID to inspect all retained branches for that run. Add a raw or normalized Item ID to inspect only that run-scoped branch. Equal item identities from different runs are intentionally kept separate by the backend contract.

Each branch renders the backend processing stages in order. Stage cards show status, evidence classification, and timestamp when available. Connectors show backend edge kind and measured duration when available.

Select a stage to inspect:

- event type, producer, and event identity;
- raw/normalized item identity;
- source and monitoring profile;
- outcome and score;
- trace context;
- Kafka topic, partition, offset, and key.

`NOT OBSERVED`, partial-history state, and reconstruction limitations are intentional diagnostic information. The browser does not fill these gaps by inference. This view does not replace distributed tracing.

## Cross-check UI data against REST

Assuming the backend is running on `http://localhost:8080`, the following calls use the same public boundaries as the browser:

```bash
curl -s http://localhost:8080/api/v1/sources | jq
```

```bash
curl -s http://localhost:8080/api/v1/monitoring-profiles | jq
```

```bash
curl -s -X POST http://localhost:8080/api/v1/sources/<SOURCE_ID>/test | jq
```

```bash
curl -s 'http://localhost:8080/api/v1/admin/collection-runs?limit=20' | jq
```

```bash
curl -s 'http://localhost:8080/api/v1/admin/analysis/items?limit=20' | jq
```

```bash
curl -s 'http://localhost:8080/api/v1/results?limit=20' | jq
```

For a reconstructed Collection Run flow:

```bash
curl -s 'http://localhost:8080/api/v1/flows/collection-runs/<COLLECTION_RUN_ID>' | jq
```

For one run-scoped item branch:

```bash
curl -s 'http://localhost:8080/api/v1/flows/collection-runs/<COLLECTION_RUN_ID>/items/<ITEM_ID>' | jq
```

For one Result detail, take `monitoringProfileId` and `normalizedItemId` from the Results list, then call:

```bash
curl -s \
  'http://localhost:8080/api/v1/results/<NORMALIZED_ITEM_ID>?monitoringProfileId=<PROFILE_ID>' \
  | jq
```

## Automated browser verification

After installing Playwright Chromium with `npm run e2e:install`, run the deterministic browser suite with:

```bash
npm run e2e
```

The suite uses controlled REST responses and can run while the backend is stopped. It is the preferred fast check for navigation, configuration forms, Source Test presentation, request construction, filters, detail rendering, async states, resilience edge cases, and the reviewed Results visual baseline.

The visual baseline is intentionally small. If an intentional UI change alters it, update the golden explicitly:

```bash
npm run e2e:visual:update
```

Inspect the changed PNG and then run `npm run e2e` again. Do not update visual baselines merely to silence an unexplained failure.

To verify the browser against a real backend that is already running on the host:

```bash
SIGNALHARVESTER_BACKEND_URL=http://127.0.0.1:8080 npm run e2e:live
```

The live workflow creates a temporary RSS source, diagnostically tests it, and creates a temporary Monitoring Profile referencing that source. It opens a filtered Results page and establishes real SSE before the first manual run, then verifies both fixture Results arrive without `Refresh`. It keeps the durable Analysis check, opens Event Explorer with real SSE before a second manual run, verifies a newly correlated observed event arrives without `Refresh`, and follows a real Analysis event into the item and full-run Processing Flow views. Cleanup deletes the profile before deleting the source.

By default the backend must be able to reach a loopback fixture on the same host. For a backend in a container, set `SIGNALHARVESTER_LIVE_FIXTURE_HOST` to a hostname that the backend container can use to reach the host fixture, when such routing is configured.

## Production route and asset verification

Primary screens are loaded as route-level chunks. After building the frontend, verify the expected route entries and print the measured raw/gzip asset baseline with:

```bash
npm run build
npm run build:assets
```

The command reads the Vite production manifest and fails if a primary feature page is no longer a dynamic build entry. Reported asset sizes are informational until a reviewed baseline justifies an explicit budget.

## Browser troubleshooting

When a screen looks inconsistent, use browser developer tools and check the Network panel first.

Useful questions are:

- which `/api/...` request was sent;
- which query parameters or request body fields were included;
- what HTTP status came back;
- whether the JSON response matches what the page renders;
- whether the backend response itself is stale or unexpected.

In normal local development, Vite proxies `/api` to the backend configured by `VITE_DEV_PROXY_TARGET`.

## Current safety limitation

There is no login, session, token, or role model. The footer deliberately exposes that state. Do not deploy the current build as a public administration surface.
