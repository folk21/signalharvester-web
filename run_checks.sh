#!/usr/bin/env bash
set -euo pipefail

run_step() {
  local label="$1"
  shift
  printf '\n==> %s\n' "$label"
  "$@"
}

run_step "Generate OpenAPI TypeScript types" npm run api:generate
run_step "Typecheck application and browser tests" npm run typecheck
run_step "Run Vitest" npm test
run_step "Run deterministic Playwright browser tests" npm run e2e
run_step "Build production frontend" npm run build

printf '\nAll routine SignalHarvester Web checks passed.\n'
