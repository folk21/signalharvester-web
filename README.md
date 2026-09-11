# SignalHarvester Web

Initial administrative frontend for SignalHarvester.

The application intentionally starts without authentication and is intended for local or otherwise trusted environments only. It uses the backend REST/OpenAPI contract and does not access Kafka or PostgreSQL directly.

## Current screens

- Dashboard — quick counts and recent collection status.
- Sources — create, edit, enable/disable, and delete configured sources.
- Collection Runs — start a manual collection run and inspect durable run/source outcomes.
- Analysis Items — inspect persisted normalized/deduplication state with profile/source filters.

## Technology

- React + TypeScript
- Vite
- TanStack Query
- React Router
- OpenAPI-derived TypeScript types

## Requirements

- Node.js 22+
- npm 10+
- SignalHarvester backend running locally, normally on `http://localhost:8080`

## Run locally

```bash
npm install
npm run api:generate
npm run typecheck
npm test
npm run dev
```

Open `http://localhost:5173`.

The Vite development server proxies `/api` to `http://localhost:8080`, so backend CORS changes are not required for the normal local workflow.

Override the development backend when needed:

```bash
VITE_DEV_PROXY_TARGET=http://localhost:8081 npm run dev
```

For a separately hosted frontend build, set `VITE_API_BASE_URL` to the backend origin before building. If frontend and backend use different origins, the backend must explicitly allow that origin.

## OpenAPI workflow

The backend contract snapshot used by this repository is:

```text
openapi/signalharvester-v1.yaml
```

After copying in a newer backend OpenAPI file, regenerate types:

```bash
npm run api:generate
npm run typecheck
```

`src/api/generated.ts` is generated contract output. Application code should depend on the exported OpenAPI schema types rather than duplicating REST DTOs.

## Authentication status

There is deliberately no login, session, token, or role model in this first version. Keep the admin UI and backend on a trusted local/private environment until authentication and authorization are implemented.
