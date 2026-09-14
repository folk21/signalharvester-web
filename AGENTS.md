# SignalHarvester Web Development Rules

SignalHarvester Web is a separate frontend repository for the SignalHarvester backend.

## Boundaries

- Treat the backend OpenAPI contract as the source of truth for REST request and response shapes.
- Keep backend-specific transport details inside `src/api/`.
- Do not duplicate backend business rules in the browser unless required for immediate form feedback.
- Do not read PostgreSQL or Kafka directly from the browser.
- Live event observation must use backend SSE when that endpoint becomes available.

## TypeScript and React

- Use strict TypeScript.
- Prefer small focused components and explicit props.
- Keep server state in TanStack Query rather than duplicating it into local component state.
- Keep form state local unless multiple screens genuinely share it.
- Avoid framework-specific abstractions that hide API behavior without reducing real duplication.
- Code comments must be in English and only explain non-obvious behavior.

## API Contract

The checked-in contract is `openapi/signalharvester-v1.yaml`.

After replacing it with a newer backend contract, run:

```bash
npm run api:generate
npm run typecheck
```

Do not hand-edit `src/api/generated.ts` after dependencies are available and generation can be run normally.

## Testing

- Unit-test deterministic formatting, validation, and mapping logic with Vitest.
- Keep Vitest discovery separate from Playwright. Vitest owns `src/**` and optional `tests/unit/**`; browser tests stay under `tests/e2e/**`.
- Use Playwright route mocks for fast browser behavior such as navigation, forms, filters, async states, and request construction.
- Keep `npm run e2e` independent of the backend, PostgreSQL, Kafka/Redpanda, and public internet sources.
- Keep `npm run e2e:live` opt-in. It may require a separately running backend and deterministic local fixture data.
- Prefer backend integration tests for backend behavior; do not reproduce persistence, Kafka, deduplication, or analysis guarantees in the frontend.
- Browser assertions should remain user-visible or request-boundary assertions.
- `./run_checks.sh` is the canonical routine repository verification and must include fast browser checks when they change. Keep live-backend E2E separate.

## Security

Authentication is intentionally absent in the initial local admin UI. Do not present this build as internet-safe. Authentication, authorization, CSRF/CORS policy, and deployment exposure must be addressed before public or shared deployment.

## Documentation and specifications

- Read `docs/specs/active/spec-signal-harvester-web.md` before significant product or architectural work.
- Read the current active sub-spec when the change belongs to that bounded increment.
- Treat active specs as intended change, not current implementation truth.
- Keep stable accepted architecture in `docs/ARCHITECTURE.md` and current behavior in `docs/IMPLEMENTATION.md` / `docs/USAGE.md`.
- After a sub-spec is accepted, move stable knowledge into owning docs and archive the completed sub-spec.
- Keep frontend implementation detail in this repository. Backend REST/SSE wire contracts remain backend-owned.
