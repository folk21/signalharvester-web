---
type: Specification
title: Production frontend delivery
description: Package the production React build as an independently buildable non-root HTTP image compatible with the backend-owned Kubernetes frontend workload boundary.
document_role: subspec
spec_status: verification-pending
parent: ../spec-signal-harvester-web.md
---
# Production frontend delivery

## Status

Verification-pending. The production image definition, static-server configuration, repository delivery checks, and opt-in container verification are implemented. Developer acceptance still requires the canonical frontend gate plus a real container-image verification run.

## Feature scope

- `WEB.PRODUCTION_DELIVERY` — reproducible production image packaging and static runtime behavior.
- `WEB.CONTRACT_INTEGRATION` — preserve the explicit build-time backend origin boundary through `VITE_API_BASE_URL`.
- `WEB.AUTH_SESSION` — keep credentialed browser security compatible with same-origin or explicitly configured credentialed CORS deployments.
- `WEB.ROUTE_DELIVERY` — serve the generated production bundle and preserve SPA deep-link routing.
- `WEB.BROWSER_VERIFICATION` — verify delivery invariants without duplicating backend Kubernetes ownership.

Related backend feature IDs:

- `DEPLOYMENT.KUBERNETES`;
- `DELIVERY.FRONTEND_BACKEND_BOUNDARY`;
- `SECURITY.AUTHENTICATION`;
- `SECURITY.AUTHORIZATION`.

## Goal

Produce the real `signalharvester-web` runtime image required by the backend repository's existing Kubernetes frontend workload boundary while keeping frontend and backend artifacts independently buildable.

The local Kubernetes contract currently expects image `signalharvester-web:local`, HTTP on container port `8080`, and a frontend bundle built with `VITE_API_BASE_URL=http://localhost:8080` for the documented dual-port-forward workflow.

## Current state

The accepted frontend already produces a Vite `dist/` bundle with route-level chunks and supports an explicit `VITE_API_BASE_URL` at build time. The backend repository already owns the Kubernetes Deployment/Service manifest and expects a separately built frontend image; it does not build frontend source.

Before this slice, this repository had no production container image definition or container-level runtime verification.

## Requirements

### D1 — independent multi-stage image build

Feature: `WEB.PRODUCTION_DELIVERY`.

The repository must own a multi-stage Docker build that:

- installs dependencies reproducibly from `package-lock.json` with `npm ci`;
- regenerates OpenAPI-derived TypeScript types before building;
- produces the normal Vite production bundle;
- copies only the built static output into the runtime image;
- does not require backend source or backend build artifacts.

### D2 — explicit backend origin at build time

Features: `WEB.CONTRACT_INTEGRATION`, `WEB.AUTH_SESSION`.

The image build must accept `VITE_API_BASE_URL` as an explicit build argument and pass it into the Vite production build.

An empty value must remain valid for same-origin deployments. The documented local Kubernetes workflow must build with `http://localhost:8080`, matching the backend repository's existing frontend-boundary contract.

The runtime image must not invent a second backend-discovery mechanism that can disagree with the compiled frontend contract.

### D3 — non-development static runtime

Feature: `WEB.PRODUCTION_DELIVERY`.

The runtime image must use a production static HTTP server rather than `vite dev` or `vite preview`.

It must:

- listen on container port `8080`;
- run as a non-root user;
- serve the built application shell at `/`;
- return the application shell for React Router deep links such as `/results`;
- return missing hashed assets as `404` rather than the application shell.

### D4 — cache behavior

Features: `WEB.PRODUCTION_DELIVERY`, `WEB.ROUTE_DELIVERY`.

Vite hashed assets under `/assets/` should be served with long-lived immutable caching. HTML/navigation responses must remain revalidation-safe so deployments do not pin an obsolete asset manifest indefinitely.

### D5 — repository delivery verification

Feature: `WEB.BROWSER_VERIFICATION`.

The canonical repository gate must verify the static delivery definition after the normal production build. The check must protect at least:

- reproducible dependency installation in the image build;
- OpenAPI regeneration and production build steps;
- explicit `VITE_API_BASE_URL` support;
- non-root runtime declaration;
- port `8080`;
- SPA deep-link fallback;
- immutable asset caching and non-immutable HTML caching.

This structural check must not require Docker so the normal frontend gate remains deterministic in environments without a container daemon.

### D6 — real container verification

Feature: `WEB.PRODUCTION_DELIVERY`.

Provide an opt-in Docker-backed verification command that:

1. builds `signalharvester-web:local` with the documented local backend origin;
2. verifies that the final image declares a non-root user;
3. runs the image with container port `8080` published to an ephemeral loopback host port;
4. verifies `/` returns the production application shell;
5. verifies `/results` returns the same shell for client-side routing;
6. removes the temporary verification container even when a check fails.

The frontend repository must not apply or mutate backend-owned Kubernetes manifests.

## Non-goals

This stage does not:

- move Kubernetes Deployment/Service ownership into the frontend repository;
- add TLS, Ingress, DNS, certificates, or Internet exposure policy;
- change backend CORS, cookie, CSRF, JWT, or RBAC behavior;
- add runtime backend-origin discovery or configuration templating;
- add frontend observability vendors or a service worker;
- accept the cross-repository Kubernetes platform requirement without a real cluster run.

## Validation

The stage is ready for frontend acceptance when:

- `./run_checks.sh` passes, including `npm run delivery:verify`;
- `npm run image:verify` passes with a working Docker daemon;
- the resulting image is `signalharvester-web:local`, runs non-root, and serves HTTP on `8080`;
- the image is ready to be loaded into the backend repository's existing `infra/kubernetes/frontend` workload for cross-repository platform acceptance.
