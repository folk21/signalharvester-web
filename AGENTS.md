# AGENTS.md

This file defines repository-wide development rules for coding agents working on SignalHarvester Web.

Follow it strictly. Read the nearest local `AGENTS.md` before changing a concrete area if additional local instructions are added later. Local instructions may add stricter rules for their scope, but must not weaken the repository-wide invariants defined here.

Prefer the smallest correct change that satisfies the task.

## Project Intent

SignalHarvester Web is the React/TypeScript browser application for SignalHarvester.

The stable architectural rule is:

> The frontend presents and operates backend capabilities through explicit REST/OpenAPI and SSE contracts. Backend business rules and persistence remain backend-owned.

This repository is independently buildable and deployable from the backend. It owns browser behavior, interaction, presentation, frontend state management, and browser verification. It does not own PostgreSQL, Kafka, backend business semantics, or backend authorization decisions.

## Source of Truth

Use this ownership order:

1. production frontend code and the checked-in OpenAPI snapshot define implemented browser behavior and consumed REST shapes;
2. tests define verified browser behavior;
3. active specifications define intended changes for work in progress;
4. `docs/ARCHITECTURE.md` defines stable frontend architecture and dependency boundaries;
5. `docs/IMPLEMENTATION.md` explains current screens, wiring, and implementation details;
6. other owning documents define usage, roadmap, feature vocabulary, and specification workflow;
7. archived specifications are historical only.

The backend repository remains authoritative for backend behavior and published REST/OpenAPI, SSE, security, persistence, and event semantics. When the checked-in frontend OpenAPI snapshot is intentionally updated, regenerate frontend types and adapt the browser to that contract. Do not silently redefine backend wire contracts in frontend code or documentation.

When documentation conflicts with implemented frontend behavior, verify the behavior, fix the owning document, and avoid duplicating the same rule in multiple places.

## Repository Boundaries

Keep responsibilities explicit:

- `src/api/` owns frontend transport details and OpenAPI-derived application-facing types;
- `src/features/` owns screen-oriented behavior and presentation;
- `src/components/` owns genuinely shared presentation components;
- `src/lib/` owns small deterministic helpers that are not feature-specific;
- `src/styles/` owns repository-wide styling;
- `src/App.tsx` owns route composition;
- `src/main.tsx` owns React/query/router composition;
- `tests/e2e/` owns Playwright browser behavior and live-browser acceptance;
- `openapi/` owns the checked-in backend OpenAPI snapshot used by this repository.

Do not create browser-side copies of backend domain models, persistence entities, scheduling rules, deduplication rules, analysis semantics, or authorization policy.

The browser must never connect directly to PostgreSQL or Kafka.

## Code Structure and Design

- Keep the architecture flexible but simple. Do not introduce abstractions, layers, state frameworks, or component systems without a concrete reason.
- Apply DRY thoughtfully: remove stable duplication that creates maintenance risk, but prefer limited duplication over premature generalization.
- Prefer composition over inheritance.
- Add shared abstractions after the repeated interaction or boundary is understood, not in anticipation of hypothetical reuse.
- Keep component props and API boundaries explicit.
- Keep mutable state ownership obvious.
- Keep components and functions reasonably sized and focused. Do not split code mechanically into tiny components or helpers when that reduces readability.
- Preserve unrelated behavior and avoid drive-by refactors.
- Do not introduce hidden conventions that cannot be discovered from the repository.
- Keep primary feature screens route-level split unless measured behavior justifies eager loading.

## TypeScript and React

- Use strict TypeScript.
- Prefer small focused components and explicit props.
- Keep server state in TanStack Query rather than duplicating it into local component state or another global cache.
- Keep form and transient interaction state local unless multiple screens genuinely share it.
- Prefer semantic HTML and native browser behavior before custom interaction abstractions.
- Keep accessibility behavior explicit and testable.
- Avoid framework-specific abstractions that hide API behavior without reducing real duplication.
- All code comments, configuration comments, examples, and software documentation are in English.
- Comments should explain non-obvious reasoning, invariants, browser behavior, or compatibility constraints. Do not comment code that is already clear from naming and structure.

## Communication Contracts

Use the transport that matches the boundary:

- browser request/response APIs: REST + JSON described by backend OpenAPI;
- backend-to-browser live updates: SSE + JSON using backend-owned payload semantics;
- browser-internal interaction: React state, TanStack Query, and explicit component props.

Do not add direct Kafka, Protobuf, database, or backend implementation dependencies to the browser.

### REST and OpenAPI

The checked-in backend contract is `openapi/signalharvester-v1.yaml`.

OpenAPI is authoritative for REST request and response shapes. Application code should consume generated schema types through `src/api/types.ts` rather than duplicate REST DTOs.

After replacing the OpenAPI snapshot, run:

```bash
npm run api:generate
npm run typecheck
```

Do not hand-edit `src/api/generated.ts` when normal generation is available.

When changing frontend behavior because a backend HTTP contract changed, update the OpenAPI snapshot, generated types, API adapter, affected UI, and browser tests together.

### SSE

SSE payload semantics remain backend-owned. The frontend may own connection lifecycle, buffering, cache merge behavior, reconnect presentation, and browser-specific recovery.

Keep durable REST reads as the recovery/source-of-truth boundary where the backend contract defines them. Do not replace a published SSE/REST model with browser polling or inferred event semantics merely for convenience.

## State Ownership

TanStack Query owns remote/server state.

Local React state owns transient browser concerns such as:

- form input before submission;
- selected rows or details;
- unapplied filters;
- local panel visibility;
- focus and interaction state.

Do not introduce Redux or another global client-state/cache framework without a concrete requirement that the current model cannot handle clearly.

## Browser and Presentation Rules

- Backend validation and authorization remain authoritative. Client-side checks may improve immediate feedback but must not be treated as enforcement.
- Every data-driven screen must distinguish loading, failure, successful empty, and successful populated states where those states apply.
- Preserve useful backend error detail at the browser boundary without exposing secrets or implementation-only data.
- Large bounded backend responses may use local scroll/wrapping containment. Do not invent pagination, truncation, or ordering semantics that the backend contract does not publish.
- Keep operational/diagnostic detail explicit on admin/diagnostic surfaces. Future viewer-oriented surfaces should not expose internal operational detail merely because it is available in another role-specific workflow.
- A component library should be added only when repeated interaction/accessibility patterns justify the dependency and migration cost.

## Security

Backend security is the authoritative enforcement boundary.

Frontend role checks may control navigation, affordances, and presentation, but they never replace backend authorization.

Until the checked-in frontend contract and implementation include the intended authentication/authorization flow, treat the application as a trusted-environment tool. Do not document the current build as internet-safe.

Security-related frontend work must consider together, as applicable:

- authentication/session lifecycle;
- HttpOnly cookie behavior defined by the backend contract;
- CSRF protection required by the backend contract;
- `401`/`403` handling;
- role-aware navigation and workflows;
- CORS/cross-origin deployment policy;
- safe handling of source-management capabilities that authorize backend outbound access.

Never store secrets, real credentials, or authentication tokens in checked-in frontend source or local configuration examples.

## Dependencies

Keep the dependency surface small.

Before adding a library, check whether React, the browser platform, TanStack Query, Vite, Playwright, Vitest, TypeScript, or an existing dependency already solves the problem clearly.

Do not add or upgrade dependencies, plugins, UI frameworks, state frameworks, analytics/error-reporting services, or build infrastructure unless the task explicitly requires it or the user approves it.

Do not introduce a framework-wide abstraction to solve one local problem.

## Testing Rules

Every behavioral or contract-consumption change requires appropriate tests.

Use the smallest useful layer first:

- Vitest for deterministic formatting, validation, mapping, and other small TypeScript logic;
- deterministic Playwright for navigation, forms, filters, async states, accessibility behavior, request construction, SSE browser behavior, and route/runtime behavior;
- opt-in live Playwright only for bounded browser/backend contract acceptance that requires a real backend.

Keep Vitest discovery separate from Playwright. Vitest owns `src/**` and optional `tests/unit/**`; browser tests stay under `tests/e2e/**`.

The deterministic Playwright suite must not require the backend, PostgreSQL, Kafka/Redpanda, public internet sources, production credentials, or external SaaS.

Frontend tests must not reproduce backend persistence, Kafka, deduplication, scheduling, analysis, or authorization semantics. Assert user-visible behavior and request/response boundaries instead.

Keep `npm run e2e:live` opt-in. It may require a separately running backend and deterministic local fixture data.

`./run_checks.sh` is the canonical routine repository gate. When routine validation changes, update the script and owning documentation together. Live-backend E2E stays separate unless repository policy explicitly changes.

Never claim a test, build, visual comparison, or live acceptance passed unless it was actually run successfully.

## Documentation Ownership

Each topic should have one authoritative owner:

| Topic | Owner |
|---|---|
| Repository overview and quick start | `README.md` |
| Agent development rules | `AGENTS.md` |
| Stable frontend architecture and dependency boundaries | `docs/ARCHITECTURE.md` |
| Current implementation and screens | `docs/IMPLEMENTATION.md` |
| User/developer workflows | `docs/USAGE.md` |
| Future work and sequencing | `docs/ROADMAP.md` |
| Stable frontend feature vocabulary | `docs/FEATURES.md` |
| Completed project changes | `CHANGELOG.md` |
| Specification workflow/navigation | `docs/specs/README.md` |
| Intended significant changes | active specifications |
| Consumed REST schema | `openapi/signalharvester-v1.yaml` |

Do not create a second document that restates an existing owner's content. Link to the owning document instead.

Specifications describe intended changes, not permanent current-state architecture. After implementation is accepted, move stable knowledge into the owning documentation and archive the completed specification.

Keep specification lifecycle state unambiguous:

- a spec exists in exactly one lifecycle location (`active/` or `archive/`), never both;
- archival is a move, not a duplicated copy;
- umbrella `current_focus`, `docs/specs/README.md`, and the active spec tree must agree;
- an implemented-but-unverified slice may remain active with `verification-pending`;
- accepted behavior belongs in current-state documentation rather than being maintained twice in an active spec.

Keep active specifications synchronized with the stable feature vocabulary in `docs/FEATURES.md`:

- identify the existing frontend feature IDs that own the scope of a new specification;
- add a new feature ID only for a genuinely new long-lived capability;
- do not create a feature ID merely because a new specification, implementation stage, refactor, or test file exists;
- keep related backend feature IDs explicit where they improve cross-repository navigation;
- treat renaming or removing a published feature ID as a repository-wide vocabulary migration.

Do not edit archived specifications during normal implementation or documentation cleanup. Archived specs are historical records unless a task explicitly requests historical correction.

Do not update broad documentation or CHANGELOG for trivial local refactors that do not change behavior, contracts, architecture, validation workflow, or contributor-facing knowledge.

CHANGELOG entries begin with the date in `YYYY-MM-DD` format; time is omitted.

### Documentation Writing Style

Repository documentation is working context for both developers and coding agents. Optimize it for precise interpretation, efficient retrieval, and human readability.

- Use clear, direct, modern English.
- Preserve technical precision. Simplify language, not contracts, invariants, ownership, or browser behavior.
- Use stable terminology for the same concept throughout the repository.
- Prefer short sentences with one primary assertion.
- State ownership, dependency direction, ordering, failure semantics, browser/backend boundaries, and compatibility rules explicitly when they affect implementation.
- Use normative words consistently in specifications: `must`, `must not`, `should`, and `may`.
- Separate ordered interaction/processing sequences from invariants and validation rules when both matter.
- Use bullets and small sections when they improve scanability and retrieval.
- Clearly distinguish implemented behavior from verification-pending work, planned work, and deferred ideas.
- Prefer concrete references to routes, API paths, OpenAPI schemas, React boundaries, commands, and backend feature IDs over abstract wording.
- Keep requirement IDs and established domain terms stable.
- Use stable frontend feature IDs from `docs/FEATURES.md`; do not invent local feature codes in individual specs or tests.
- Specification clarity for coding agents is more important than aggressive shortening. Do not remove explicit constraints merely to make a spec more concise.

## Always / Ask First / Never

### Always

- Read this file before changing the repository.
- Read the active umbrella and current sub-spec before significant product or architectural work.
- Inspect existing implementation, API adapters, tests, and owning documentation before introducing a new pattern.
- Respect backend contract ownership and frontend state boundaries.
- Make the smallest coherent change.
- Update tests for behavioral or contract-consumption changes.
- Run and report relevant validation.
- Report changed files, deleted/moved files, and anything not verified.

### Ask First, Unless the Task Explicitly Authorizes It

- Add or upgrade dependencies/plugins.
- Introduce a new frontend framework, state framework, component library, analytics/error-reporting service, or service worker.
- Make an incompatible assumption about a backend REST/SSE contract.
- Replace REST/SSE with a different browser transport.
- Create a second frontend application, micro-frontend boundary, or new deployment topology.
- Perform a broad refactor that affects unrelated features.
- Introduce client-side persistence of security-sensitive data.

### Never

- Read PostgreSQL or Kafka directly from the browser.
- Hand-edit generated OpenAPI TypeScript output when normal generation is available.
- Reimplement backend authorization as frontend enforcement.
- Duplicate backend persistence or business semantics in the browser.
- Commit secrets, real credentials, tokens, or local `.env` values.
- Hardcode developer-machine-specific paths or environment behavior.
- Disable or weaken tests to hide regressions.
- Invent APIs, backend behavior, feature IDs, benchmark numbers, or test results.
- Edit archived specifications as part of routine current-state cleanup.
- Perform unrelated cleanup while completing a focused task.

## Working Style

1. Identify the frontend feature and applicable active specification.
2. Inspect the current implementation, OpenAPI boundary, tests, and owning documentation.
3. State the intended scope when the task is substantial.
4. Reuse existing patterns when they are sound; do not clone a bad pattern merely for consistency.
5. Implement the smallest correct change.
6. Run focused validation, then the broader repository gate appropriate to the change.
7. Update only the owning documentation and active specification state that actually changed.
8. Report what changed, what was validated, what remains unverified, and an appropriate commit message.

## Progressive Disclosure

Read detailed guidance only when relevant:

- `docs/FEATURES.md` — stable frontend feature vocabulary and related backend capability IDs;
- `docs/ARCHITECTURE.md` — frontend boundaries, state ownership, contracts, and delivery model;
- `docs/IMPLEMENTATION.md` — current screens and implementation wiring;
- `docs/USAGE.md` — current browser and verification workflows;
- `docs/ROADMAP.md` — sequencing and deferred work;
- `docs/specs/README.md` — specification workflow and active navigation;
- `docs/specs/active/spec-signal-harvester-web.md` — current frontend product target;
- `openapi/signalharvester-v1.yaml` — checked-in backend REST contract snapshot.

When in doubt, preserve existing contracts and browser/backend boundaries, choose the smaller change, and do not invent missing requirements.
