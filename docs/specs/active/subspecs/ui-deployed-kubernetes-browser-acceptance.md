---
type: Specification
title: Deployed Kubernetes browser acceptance
description: Verify the real production frontend image against the backend-owned Kubernetes frontend workload and security boundary without duplicating cluster ownership.
document_role: subspec
spec_status: verification-pending
parent: ../spec-signal-harvester-web.md
---
# Deployed Kubernetes browser acceptance

## Status

Verification-pending. The frontend repository now provides an opt-in Playwright configuration that reuses the accepted live browser pipeline against an already deployed production frontend instead of starting Vite. Developer acceptance requires a real local Kubernetes run with the backend-owned frontend workload.

## Feature scope

- `WEB.PRODUCTION_DELIVERY` — verify the accepted production image through the backend-owned Kubernetes runtime boundary.
- `WEB.LIVE_BACKEND_ACCEPTANCE` — reuse the real-backend browser pipeline against a deployed frontend origin.
- `WEB.CONTRACT_INTEGRATION` — verify the compiled `VITE_API_BASE_URL` reaches the real backend REST/SSE contract.
- `WEB.AUTH_SESSION` — verify browser cookies, CSRF proof, and session lifecycle across the documented deployed origins.
- `WEB.AUTHORIZATION_UX` — exercise protected ADMIN + VIEWER workflows after deployed login.

Related backend feature IDs:

- `DEPLOYMENT.KUBERNETES`;
- `DELIVERY.FRONTEND_BACKEND_BOUNDARY`;
- `SECURITY.AUTHENTICATION`;
- `SECURITY.AUTHORIZATION`;
- `SECURITY.EXTERNAL_SOURCE_ACCESS`.

## Goal

Close the frontend side of the cross-repository Kubernetes acceptance boundary with the real `signalharvester-web:local` image and the backend-owned `infra/kubernetes/frontend` Deployment/Service.

The frontend repository must verify browser behavior against an already running deployment. It must not apply, patch, or duplicate backend-owned Kubernetes resources.

## Current state

`WEB.PRODUCTION_DELIVERY` is accepted after the canonical frontend gate and Docker-backed image verification passed on 2026-09-17.

The repository already has an opt-in `npm run e2e:live` workflow that starts Vite locally and proxies `/api` to a real backend. That workflow proves the browser/backend functional path, but it does not verify the production image, Kubernetes Service boundary, or the documented cross-origin `localhost:5173` frontend to `localhost:8080` backend security configuration.

The backend repository already owns the Kubernetes frontend workload. It expects image `signalharvester-web:local`, container port `8080`, and the local browser bundle built with `VITE_API_BASE_URL=http://localhost:8080`.

## Requirements

### K1 — external deployed frontend origin

Features: `WEB.PRODUCTION_DELIVERY`, `WEB.LIVE_BACKEND_ACCEPTANCE`.

The repository must provide an opt-in Playwright command that targets an externally served frontend URL and does not start Vite, `vite preview`, Nginx, Docker, or Kubernetes itself.

The default deployed browser URL should match the backend repository's documented frontend port-forward: `http://localhost:5173`.

A caller may override it with `SIGNALHARVESTER_WEB_URL` for another already deployed environment.

### K2 — real compiled backend origin

Features: `WEB.CONTRACT_INTEGRATION`, `WEB.AUTH_SESSION`.

The deployed acceptance must exercise the backend origin compiled into the production bundle rather than using the Vite development proxy.

For the documented local Kubernetes workflow:

- frontend browser origin: `http://localhost:5173`;
- backend browser origin: `http://localhost:8080`;
- `SIGNALHARVESTER_BACKEND_URL` used by authenticated test cleanup: `http://localhost:8080`.

Using `localhost` consistently is required for the documented cookie/CORS test boundary. The acceptance command must not silently substitute `127.0.0.1` for one side of this deployed workflow.

### K3 — reuse the accepted live pipeline

Feature: `WEB.LIVE_BACKEND_ACCEPTANCE`.

The deployed workflow must reuse the existing real-backend browser scenario rather than create a second reduced copy of the same product flow.

It must continue to cover:

- browser login with an explicit `ADMIN` + `VIEWER` identity;
- authenticated Source creation and Source Test;
- Monitoring Profile creation;
- Results REST/SSE delivery;
- Analysis visibility;
- Event Observation REST/SSE delivery;
- Processing Flow navigation;
- CSRF-protected cleanup.

This stage changes the serving/deployment boundary under the browser, not backend business semantics.

### K4 — deterministic fixture reachability remains explicit

Features: `WEB.LIVE_BACKEND_ACCEPTANCE`, `WEB.CONTRACT_INTEGRATION`.

The test continues to own its deterministic RSS fixture on the developer host. A containerized backend must be able to reach the advertised fixture host.

`SIGNALHARVESTER_LIVE_FIXTURE_HOST` remains the explicit override for cluster-specific host reachability. Backend external-source authorization must explicitly permit that deterministic fixture destination for the acceptance run.

The frontend must not weaken or bypass backend outbound-source policy.

### K5 — no credential persistence

Feature: `WEB.AUTH_SESSION`.

The deployed workflow must receive `SIGNALHARVESTER_LIVE_USERNAME` and `SIGNALHARVESTER_LIVE_PASSWORD` through process environment only. It must not add credentials, JWTs, CSRF values, or generated cluster secrets to repository files.

### K6 — opt-in cluster acceptance

Feature: `WEB.LIVE_BACKEND_ACCEPTANCE`.

The deployed workflow must remain outside `./run_checks.sh` because the frontend repository does not own Kubernetes lifecycle, backend startup, cluster image loading, port-forwards, or test credentials.

The canonical deterministic frontend gate must remain backend- and cluster-independent.

## Acceptance sequence

1. Build `signalharvester-web:local` with `VITE_API_BASE_URL=http://localhost:8080`.
2. Load the image into the local Kubernetes cluster when the cluster does not share the host image store.
3. Apply the backend repository's existing `infra/kubernetes/frontend` workload.
4. Port-forward backend `8080:8080` and frontend `5173:8080` using the backend repository workflow.
5. Ensure the backend security environment has an enabled identity with explicit `ADMIN` and `VIEWER` roles.
6. Configure `SIGNALHARVESTER_LIVE_FIXTURE_HOST` and backend outbound-source allow rules when the in-cluster backend cannot reach the developer-host fixture through its default address.
7. Run `npm run e2e:deployed` with the deployed frontend/backend URLs and test credentials.
8. Treat the stage as accepted only after the deployed browser scenario passes against the production image.

## Non-goals

This stage does not:

- copy or modify backend Kubernetes manifests;
- create a Kubernetes cluster;
- load images into kind/k3d automatically;
- create or read backend Secret objects;
- change backend CORS, cookie, CSRF, JWT, RBAC, or external-source authorization policy;
- add TLS, Ingress, DNS, certificates, or Internet exposure policy;
- add a second product/browser scenario that duplicates the existing live pipeline.

## Validation

The stage is ready for acceptance when:

- `./run_checks.sh` still passes;
- `npm run image:verify` still passes;
- `npm run e2e:deployed` passes against the backend-owned Kubernetes frontend workload with the production image;
- the run uses `http://localhost:5173` for the documented frontend port-forward and `http://localhost:8080` for the backend browser origin, unless both are deliberately replaced by another compatible deployed environment;
- login, credentialed REST, CSRF-protected mutations, Results/Event SSE, Processing Flow navigation, and cleanup all succeed without the Vite development server or proxy.
