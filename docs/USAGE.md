---
type: Usage Guide
title: SignalHarvester Web usage
description: Current UI workflows for source configuration, collection operations, analysis inspection, Results browsing, and manual contract verification.
---
# SignalHarvester Web usage

## Scope

This document describes how to use the current frontend after it is running. Installation, prerequisites, and local startup remain in the root [`README.md`](../README.md).

The current build has no authentication. Use it only with a trusted local/private backend.

## Typical workflow

A useful current workflow is:

1. configure or enable one or more sources;
2. start a manual Collection Run;
3. inspect per-source run outcomes;
4. inspect normalization/deduplication state when diagnosing processing;
5. browse analyzed Results;
6. open one Result to inspect content, analysis metadata, and provenance.

The current backend also supports deterministic live pipeline verification outside the browser. Use the backend repository's `tools/live-backend/` workflow when you need to distinguish a frontend problem from a backend pipeline problem.

## Dashboard

Open `/`.

The Dashboard shows bounded recent information from the current source, collection, analysis, and Results APIs. It is intended as a quick operational overview.

Use the dedicated screens for complete actions and details.

## Sources

Open `/sources`.

The screen supports:

- listing configured sources;
- creating a source;
- editing source fields;
- enabling/disabling collection for a source;
- deleting a source.

Source settings are currently entered as a JSON string map because that is the shape exposed by the backend contract.

A configured source can authorize outbound backend HTTP access to its destination. Do not expose source management to untrusted users while the application has no authentication/authorization and before backend outbound-destination policy is hardened.

## Collection Runs

Open `/runs`.

Use this screen to start a manual run and inspect recent completed run state. Run detail exposes durable per-source outcomes returned by the backend.

RSS/Atom sources may produce multiple published semantic items from one fetched feed. The run's published counts and source outcomes therefore describe extracted items rather than merely successful HTTP responses.

Automatic schedule management is not available yet.

## Analysis Items

Open `/analysis`.

This screen is a technical inspection view for normalized/deduplication state. It supports the current backend filters for monitoring profile and source.

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

The Results page does not yet receive SSE updates. Use the page refresh action to fetch current state after new processing completes.

## Cross-check UI data against REST

During development, the simplest way to verify what the UI displays is to call the same backend REST APIs directly.

Assuming the backend is running on `http://localhost:8080`:

```bash
curl -s http://localhost:8080/api/v1/sources | jq
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

This checks the same public application boundary used by the browser. It is usually more useful than comparing the UI directly with database tables because the REST contract is the frontend source of truth.

For one Result detail, first take `monitoringProfileId` and `normalizedItemId` from the Results list, then call:

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

This suite uses controlled REST responses and can run while the backend is stopped. It is the preferred fast check for navigation, forms, filters, request construction, detail rendering, and async states.

To verify the browser against a real backend that is already running on the host:

```bash
SIGNALHARVESTER_BACKEND_URL=http://127.0.0.1:8080 npm run e2e:live
```

The live workflow owns a temporary RSS fixture and temporary source. It uses a unique monitoring-profile ID so earlier Analysis deduplication state does not suppress the expected Results. Other already-enabled sources may participate in the same Collection Run, so the test asserts the two outcomes belonging to its temporary source rather than requiring the whole run to be globally successful.

By default the backend must be able to reach a loopback fixture on the same host. For a backend in a container, set `SIGNALHARVESTER_LIVE_FIXTURE_HOST` to a hostname that the backend container can use to reach the host fixture, when such routing is configured.

## Browser troubleshooting

When a screen looks inconsistent, use browser developer tools and check the Network panel first.

Useful questions are:

- which `/api/...` request was sent;
- which query parameters were included;
- what HTTP status came back;
- whether the JSON response matches what the page renders;
- whether the backend response itself is stale or unexpected.

In normal local development, Vite proxies `/api` to the backend configured by `VITE_DEV_PROXY_TARGET`.

## Current safety limitation

There is no login, session, token, or role model. The footer deliberately exposes that state. Do not deploy the current build as a public administration surface.
