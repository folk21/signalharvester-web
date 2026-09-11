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

- Unit-test deterministic formatting, validation, and mapping logic.
- Prefer backend integration tests for backend behavior; do not reproduce them in the frontend.
- UI tests should focus on navigation, form behavior, query states, and error presentation.

## Security

Authentication is intentionally absent in the initial local admin UI. Do not present this build as internet-safe. Authentication, authorization, CSRF/CORS policy, and deployment exposure must be addressed before public or shared deployment.
