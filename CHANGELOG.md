# Changelog

## Unreleased

2026-09-15 Added targeted Playwright visual regression with a reviewed populated Results/detail golden image and an explicit baseline-update workflow.

2026-09-15 Accepted the UI resilience and edge-case verification slice after the routine frontend checks passed.

2026-09-15 Strengthened deterministic browser verification with keyboard-only table inspection, SSE reconnect/resnapshot, stale bounded deep links, partial Processing Flow evidence, and narrow-viewport long-data coverage.

2026-09-15 Added keyboard-accessible inspection controls to Runs, Analysis, Results, and Event Explorer tables.

2026-09-14 Added Processing Flow visualization with run/item lanes, evidence-aware stage detail, durations, and cross-screen diagnostic links.

2026-09-14 Accepted live Results and Event Explorer after routine checks and manual live-backend inspection passed.

2026-09-14 Added race-free Results SSE integration, bounded Event Explorer history/live updates, and deterministic browser coverage for the SSE `ready` bootstrap.

2026-09-14 Added persisted Monitoring Profiles, bounded Source Test diagnostics, profile-driven manual Collection Runs, and synchronized the frontend OpenAPI snapshot with the current backend contract.

2026-09-14 Accepted browser verification after routine checks and the deterministic live RSS-to-Results Playwright workflow passed; archived the completed verification sub-spec.

2026-09-14 Isolated Vitest discovery from Playwright browser suites so `npm test` only runs unit/component tests.

2026-09-14 Added deterministic Playwright browser verification, canonical routine checks, and an opt-in live RSS-to-Results browser E2E workflow.

2026-09-14 Added frontend architecture, implementation, usage, roadmap, and active specification documentation, with browser verification as the next bounded UI focus.

2026-09-14 Added analyzed Results browsing, filtering, detail inspection, dashboard visibility, and the current backend OpenAPI contract.

2026-09-11 Initial administrative frontend with dashboard, source CRUD, collection-run operations, and analysis inspection.
2026-09-11 Added OpenAPI-derived TypeScript contract workflow and local Vite backend proxy configuration.
