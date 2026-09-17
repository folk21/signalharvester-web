# SignalHarvester Web

SignalHarvester Web is the React/TypeScript frontend for SignalHarvester. It is one coherent browser application for configuration, operations, analyzed Results, and pipeline diagnostics over backend REST/OpenAPI and SSE contracts.

The current build includes the frontend authentication/session foundation over the backend cookie/CSRF contract. Backend authorization remains authoritative, and ADMIN identity management plus the dedicated viewer Results experience are still separate follow-up stages. The browser never reads PostgreSQL or Kafka directly.

## Interface

![SignalHarvester analyzed results screen](docs/images/signalharvester-screen.png)

The current UI lets a user configure Sources and Monitoring Profiles, start and inspect Collection Runs, browse analyzed Results, receive live updates, and investigate technical event/processing-flow evidence.

## Start here

- [`AGENTS.md`](AGENTS.md) — repository-wide development rules.
- [`docs/FEATURES.md`](docs/FEATURES.md) — stable frontend feature IDs and related backend feature IDs.
- [`docs/specs/README.md`](docs/specs/README.md) — specification workflow and current implementation focus.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stable frontend architecture and dependency boundaries.
- [`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) — current screens and implementation wiring.
- [`docs/USAGE.md`](docs/USAGE.md) — current browser and verification workflows.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — next stages and deferred work.

## Current product surface

Configuration and operations:

- **Dashboard** — bounded operational overview.
- **Sources** — CRUD, enabled state, and persisted-source diagnostic Test.
- **Monitoring Profiles** — profile CRUD, category, interval, ordered source membership, criteria, and scheduled enabled state.
- **Collection Runs** — profile-driven manual execution and durable run/source outcomes.

Results and diagnostics:

- **Analysis Items** — bounded normalized/deduplication inspection.
- **Results** — filtered analyzed Result browsing, separate detail loading, and live SSE updates.
- **Event Explorer** — bounded retained technical history plus live observed events.
- **Processing Flow** — backend-reconstructed run/item stages, evidence, durations, limitations, and diagnostic metadata.

Cross-cutting browser capabilities include authentication/session bootstrap, role-aware navigation, credentialed REST/SSE transport, deterministic Playwright verification, targeted visual regression, accessibility hardening, responsive/large-data containment, and route-level code splitting with recoverable lazy-route failures. The security foundation and route-delivery slices are implemented but still verification-pending.

## Technology

- React + TypeScript
- Vite
- TanStack Query
- React Router
- OpenAPI-derived TypeScript types
- Vitest
- Playwright

## Requirements

- Node.js 22+
- npm 10+
- SignalHarvester backend on `http://localhost:8080`; use its security-enabled environment and an enabled identity for protected local integration/live-backend browser verification

## Local development

Install dependencies and verify the generated API types:

```bash
npm install
npm run api:generate
npm run typecheck
npm test
```

Start Vite:

```bash
npm run dev
```

Open `http://localhost:5173`.

The development server proxies `/api` to `http://localhost:8080` by default, so the standard same-origin local workflow does not require backend CORS changes.

Override the development backend when needed:

```bash
VITE_DEV_PROXY_TARGET=http://localhost:8081 npm run dev
```

For a separately hosted frontend build, set `VITE_API_BASE_URL` to the backend origin before building. A cross-origin deployment also requires a compatible backend CORS/security policy.

## Verification

Install Playwright Chromium once after `npm install`:

```bash
npm run e2e:install
```

Run the deterministic browser suite:

```bash
npm run e2e
```

This suite controls REST/SSE browser boundaries and does not require the backend, PostgreSQL, Kafka/Redpanda, or public internet sources.

Run only the reviewed visual comparison with:

```bash
npm run e2e:visual
```

When an intentional UI change requires a new golden image:

```bash
npm run e2e:visual:update
```

Inspect the changed image, rerun `npm run e2e:visual`, and then run the canonical repository gate. Routine verification never updates visual baselines automatically.

Run the opt-in live browser workflow against a separately running backend with:

```bash
SIGNALHARVESTER_BACKEND_URL=http://127.0.0.1:8080 \
SIGNALHARVESTER_LIVE_USERNAME=<admin-viewer-user> \
SIGNALHARVESTER_LIVE_PASSWORD=<password> \
npm run e2e:live
```

The live workflow signs in through the browser first, then uses a deterministic local RSS fixture, exercises Source Test and Monitoring Profile setup, verifies real Results and Event Observation SSE delivery, follows a real Analysis event into Processing Flow, and cleans up through the authenticated browser context with CSRF proof. The supplied identity must have both `ADMIN` and `VIEWER`. `SIGNALHARVESTER_LIVE_FIXTURE_HOST` may be used when a containerized backend needs a different hostname to reach the host fixture, and the backend security environment must permit that fixture destination.

The canonical routine repository gate is:

```bash
./run_checks.sh
```

It regenerates OpenAPI types, typechecks application and browser-test code, runs Vitest and deterministic Playwright, builds the production frontend, verifies route-level dynamic build entries, and reports production JS/CSS raw and gzip sizes. Live-backend E2E stays opt-in because this repository does not own backend lifecycle.

Inspect only the production route/asset structure with:

```bash
npm run build
npm run build:assets
```

Asset sizes are currently an informational measured baseline. Numeric budgets should be introduced only after a reviewed growth policy exists.

## Backend OpenAPI workflow

The checked-in backend REST contract snapshot is:

```text
openapi/signalharvester-v1.yaml
```

After replacing it with a newer backend contract, regenerate types and validate TypeScript:

```bash
npm run api:generate
npm run typecheck
```

`src/api/generated.ts` is generated output. Application code should depend on OpenAPI-derived aliases exposed through `src/api/types.ts` rather than duplicating REST DTOs.

## Security status

The frontend security foundation is implemented against the synchronized backend OpenAPI contract and is verification-pending. It provides `/login`, current-principal bootstrap through `/api/v1/auth/me`, HttpOnly-cookie credential transport, double-submit CSRF forwarding for mutations, credentialed native SSE, logout/session cleanup, explicit `401`/`403` handling, and additive role-aware navigation.

Backend authorization remains the security enforcement boundary. Frontend role checks control presentation only; they do not infer role hierarchy (`ADMIN` does not imply `VIEWER`) and do not replace backend enforcement. ADMIN identity management and the dedicated viewer Results UX are separate later stages.

## Documentation model

Current-state documents describe accepted implementation. Active specifications describe intended or verification-pending changes and are not implementation evidence.

`docs/FEATURES.md` owns the durable frontend capability vocabulary. Active specifications reference those IDs and may also reference related backend feature IDs for cross-repository navigation.

Archived specifications are historical records and are not part of normal current-state maintenance.
