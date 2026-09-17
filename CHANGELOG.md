---
type: Changelog
title: SignalHarvester Web changelog
description: Notable frontend changes organized by release state, with each change line prefixed by its date.
---
# Changelog

## Unreleased

- 2026-09-17 — Hardened viewer Result detail UX by omitting empty normalized-attribute sections and preserving readable primary-link hover contrast; documented that live/deployed acceptance leaves backend-owned Result/Event history and must use disposable test data.
- 2026-09-17 — Accepted deployed Kubernetes production-browser verification and advanced the active frontend focus to typed Monitoring Profile Analysis settings, explicitly blocked until the backend publishes the profile-owned OpenAPI contract.
- 2026-09-17 — Accepted production frontend delivery after the canonical repository gate and Docker-backed image verification passed; added verification-pending deployed Kubernetes browser acceptance that reuses the real-backend pipeline against an externally served production frontend.
- 2026-09-17 — Added verification-pending production image delivery with reproducible multi-stage build, non-root static serving on port 8080, SPA deep-link fallback, delivery-contract checks, and opt-in Docker runtime verification.
- 2026-09-17 — Accepted ADMIN identity management and viewer-oriented Results after the canonical frontend verification passed.
- 2026-09-17 — Added a verification-pending viewer-oriented Results experience that reuses the existing relevant Results REST/SSE boundary while omitting operational identifiers and diagnostic navigation from VIEWER-only presentation.
- 2026-09-17 — Added ADMIN identity administration for persisted user/BOT identities, including create/update role workflows, backend invariant error handling, deterministic browser coverage, and dynamic-route verification.
- 2026-09-17 — Accepted the authentication/authorization foundation and route-delivery/runtime-resilience slices after the canonical frontend verification passed.
- 2026-09-17 — Synchronized the backend security OpenAPI contract and added the verification-pending frontend authentication/session foundation with credentialed REST/SSE, CSRF forwarding, additive role-aware routing, and deterministic protected-browser coverage.
- 2026-09-17 — Added a stable `WEB.*` feature vocabulary with related backend feature IDs, aligned frontend agent rules with backend repository discipline, and refactored current documentation/active specifications for clearer ownership and retrieval without changing archived specifications.
- 2026-09-15 — Added route-level screen code splitting, accessible lazy-route loading/error containment, deterministic chunk-failure coverage, and Vite-manifest production asset reporting.
- 2026-09-15 — Added responsive and large-data UI hardening for bounded configuration tables, large source-membership lists, long Result detail values, and many-branch Processing Flow layouts.
- 2026-09-15 — Accepted focused accessibility hardening after the deterministic browser and routine frontend checks passed.
- 2026-09-15 — Added focused accessibility hardening with a keyboard skip link, named repeated configuration actions, explicit form focus restoration, semantic async/error states, and deterministic Playwright coverage.
- 2026-09-15 — Accepted the real-backend diagnostic browser path after routine checks and live Results SSE, Event Observation SSE, and Processing Flow verification passed.
- 2026-09-15 — Extended the opt-in live-backend Playwright workflow through real Results SSE, Event Observation SSE, and backend-reconstructed item/run Processing Flow diagnostics.
- 2026-09-15 — Added a focused non-updating Playwright command for reviewing the targeted visual baseline and documented the post-visual live diagnostic/accessibility hardening plan.
- 2026-09-15 — Added targeted Playwright visual regression with a reviewed populated Results/detail golden image and an explicit baseline-update workflow.
- 2026-09-15 — Accepted the UI resilience and edge-case verification slice after the routine frontend checks passed.
- 2026-09-15 — Strengthened deterministic browser verification with keyboard-only table inspection, SSE reconnect/resnapshot, stale bounded deep links, partial Processing Flow evidence, and narrow-viewport long-data coverage.
- 2026-09-15 — Added keyboard-accessible inspection controls to Runs, Analysis, Results, and Event Explorer tables.
- 2026-09-14 — Added Processing Flow visualization with run/item lanes, evidence-aware stage detail, durations, and cross-screen diagnostic links.
- 2026-09-14 — Accepted live Results and Event Explorer after routine checks and manual live-backend inspection passed.
- 2026-09-14 — Added race-free Results SSE integration, bounded Event Explorer history/live updates, and deterministic browser coverage for the SSE `ready` bootstrap.
- 2026-09-14 — Added persisted Monitoring Profiles, bounded Source Test diagnostics, profile-driven manual Collection Runs, and synchronized the frontend OpenAPI snapshot with the current backend contract.
- 2026-09-14 — Accepted browser verification after routine checks and the deterministic live RSS-to-Results Playwright workflow passed; archived the completed verification sub-spec.
- 2026-09-14 — Isolated Vitest discovery from Playwright browser suites so `npm test` only runs unit/component tests.
- 2026-09-14 — Added deterministic Playwright browser verification, canonical routine checks, and an opt-in live RSS-to-Results browser E2E workflow.
- 2026-09-14 — Added frontend architecture, implementation, usage, roadmap, and active specification documentation, with browser verification as the next bounded UI focus.
- 2026-09-14 — Added analyzed Results browsing, filtering, detail inspection, dashboard visibility, and the current backend OpenAPI contract.
- 2026-09-11 — Initial administrative frontend with dashboard, source CRUD, collection-run operations, and analysis inspection.
- 2026-09-11 — Added OpenAPI-derived TypeScript contract workflow and local Vite backend proxy configuration.
