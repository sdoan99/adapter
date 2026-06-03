---
title: Plan — Codebase Duplication Consolidation (Adapter)
status: proposed
created: 2026-06-01T01:05:00Z
last_updated: 2026-06-03T21:28:00Z
last_session: 2026-06-03T21:28:00Z
plan_file: /home/ubuntu/adapter/plans/todo/2026-06-01-duplicate-code-consolidation-plan.md
source_docs:
  - /home/ubuntu/Jobs/plans/todo/2026-06-01-duplicate-code-consolidation-plan.md
---

# Plan: Codebase Duplication Consolidation (Adapter)

> Sync client-side UDF adapter improvements back to the standalone repository and upgrade compilation configurations to eliminate ES5 boilerplate bloat.

## Context

- **Why this exists:** The UDF adapter has drifted significantly between the standalone `/home/ubuntu/adapter` and the embedded version in `project92`. The embedded version has received critical improvements (depth streaming, quotes support, async wrappers) that need to be backported. Additionally, compile target configurations compile to ES5, adding ~550 lines of duplicate typescript helpers (`__awaiter`/`__generator`) across files.
- **Scope:**
  - **In bounds:** Backporting project92 datafeed improvements to the standalone adapter repo, and upgrading build configurations to target modern JavaScript.
  - **Out of bounds:** Dataserver changes or React page layout modifications (handled in separate plans).
- **Dependencies:** The upgraded adapter bundle must remain fully compatible with standard UDF specifications and modern web browsers.

## Task Status

### [x] Completed
- (none yet — plan creation)

### [~] In Progress
- (none)

### [!] Blocked / Errors
- (none)

### [ ] Not Started
- [ ] **T1 — Backport Project92 UDF improvements** — Copy depth streaming, quotes support, namespace stripping (`split(':').pop()`), and async callback wrappers from `project92/public/datafeeds/udf-adapter/` back to the `/home/ubuntu/adapter/` files.
  - *Acceptance:* Drifting file changes are synced and standalone files achieve parity.
- [ ] **T2 — Upgrade TypeScript compile target** — Update the compilation target in `tsconfig.json` or build scripts to `ES2017` or higher. Compile the files and verify that downlevel helper functions (`__awaiter` and `__generator`) are eliminated.
  - *Acceptance:* Compiled JS adapter files do not contain transpilation boilerplate, resulting in ~28% smaller bundles.

## File Manifest

| Path | Purpose | Status |
|------|---------|--------|
| `datafeed.js` | Main UDF adapter module | modified |
| `streaming.js` | WebSocket streaming handler | modified |
| `history-provider.js` | Historical data fetcher | modified |
| `tsconfig.json` | Compiler build configuration | modified |

Status values: `untouched` / `modified` / `added` / `deleted` / `pending`

## Verification Checklist

- [ ] Build files compile successfully
- [ ] Compiled bundle files verify as clean of `__awaiter`/`__generator` functions
- [ ] Run adapter tests (`npm test` or `node test.cjs`)

## Exit Criteria (Plan-Level Definition of Done)

- [ ] **C1 — Primary objective:** Standalone adapter features are synced with project92 updates, and build targets are modern, eliminating ES5 transpilation boilerplate.
- [ ] **C2 — Stakeholder acceptance:** All test suites pass, and compiled files verify as optimized.
- [ ] **C3 — Rollback confidence:** Rollout is modular and git-revertible in under 2 minutes.

## Open Questions

- **Q1:** Do we have the original `.ts` source files, or do we need to decompile/clean the `.js` files manually?

## Decision Log

| # | Decision | Rationale | Alternative(s) Considered | Date |
|---|----------|-----------|---------------------------|------|
| | (none yet) | | | |

---

## Session Log

### 2026-06-03T21:28:00Z — Session: created split adapter duplication plan

**Work done:**
1. Split standalone UDF adapter backporting and compile target tasks out of the main duplication plan.

**State changes:**
- All tasks: `not-started`
