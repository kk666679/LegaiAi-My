# Known-Issues Triage — TODO/FIXME/HACK/XXX markers in `src/**/*.ts`

> **Auto-generated triage** — 2026-07-10, from **141 marker lines** across 30 files
> (`grep -rInE "TODO|FIXME|HACK|XXX" src --include=*.ts`).
> Read-only analysis; no source was modified. Verification notes (e.g. "STALE — already
> wired") were confirmed by reading the referenced call sites, not just the marker text.

## Reading the tables

- **type**: `bug-risk` | `missing-feature` | `cleanup` | `perf` | `test-gap` | `doc-gap` | `question` | `noise`
  - `noise` = the match is **not an open work item**: it is the TODO-*scanner's own
    implementation, a test fixture, a generated-template placeholder, or a UI mask
    (e.g. QR pixel-art `XXX` rows). 107 of the 141 lines are noise; **34 lines ≈ 22
    distinct actionable items** remain.
- **sev**: high | med | low. Auth/crypto/network/state-mutation biased high; cosmetic/logging low.
- Multi-line items (one TODO explained across several comment lines) are grouped into one row.

### Marker counts per subsystem

| Subsystem | lines | actionable items | noise lines |
|---|---:|---:|---:|
| root (`src/*.ts`: extension, autobuild, kdream-helpers) | 23 | 2 | 21 |
| `fleet/` | 6 | 4 | 0 |
| `cli/` | 3 | 2 | 0 |
| `mcp/` | 6 | 3 | 2 |
| `lmd/` | 5 | 2 | 3 |
| `bridge/` | 2 | 2 | 0 |
| `cloud/` | 2 | 1 | 1 |
| `panel/` | 2 | 1 | 0 |
| `program/` | 1 | 1 | 0 |
| `runners/` | 2 | 1 | 0 |
| `skills/dream/` | 15 | 1 | 14 |
| `statusbar/` | 1 | 1 (stale-comment cleanup) | 0 |
| `voidspec/` | 1 | 1 (stale-comment cleanup) | 0 |
| `support/` | 1 | 1 | 0 |
| `keepalive/` | 1 | 1 (deliberate opt-in) | 0 |
| `daemon/` | 1 | 0 | 1 |
| `intelligence/` | 5 | 0 | 5 |
| `test/` | 64 | 0 | 64 |
| **Total** | **141** | **~22** | **107** |

Notably: **zero markers in `src/orchestrator/` and `src/spine/`** — the core coordination
and signing layers carry no open TODOs. The closest core-risk items live in `fleet/evict.ts`
(orchestration state mutation) and the extension wiring seam.

---

## fleet/ — 6 lines, 4 items (highest-risk cluster)

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/fleet/evict.ts:23,99,267` | bug-risk / missing-feature | **high** | `TODO(§5 signing gate)`: remote/relay evict needs a signed, single-use, TTL'd intent (`{intent_id,target,mode,issued_at,expires}`). Currently **fail-closed** (`EvictRemoteBlockedError` at :272) — safe, but cross-machine evict is impossible, and an unguarded relay lane would be a forgeable remote-kill. `signature?` field (:99) is reserved. CP-6.1 `src/spine/sign.ts` (Ed25519 whole-envelope sign/verify + ReplayGuard) already exists and fits this exactly. |
| `src/fleet/evict.ts:344` | bug-risk | **high** | `TODO(reconcile_tasks)`: the pure core only *records the receipt*; the actual board/state "unclaim + re-dispatch" of released tasks (via the orchestrator's expired-claim path) and the `finding_report` per blocked dependent are delegated to a command layer that must exist — if unwired, an evicted agent's tasks strand silently. |
| `src/fleet/evict.ts:357` | bug-risk | **high** | `TODO(consensus survivor-recompute)`: evict marks the target evicted on ballots it owed, but never recomputes the 2/3 threshold against surviving voters — open consensus items can deadlock after an eviction. Must go through `resolvePendingConsensus` + `finding_report` (never auto-shrink a security quorum). |
| `src/fleet/evict.ts:76` | missing-feature | med | Intent/ack envelope (`EvictIntent`) was built for evict first; spawn / invite / pause were planned to inherit it as a fast-follow — panel progress for those actions still shows only "requested". |

## cli/ — 3 lines, 2 items (unwired, user-facing commands)

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/cli/fleet-templates.ts:17,309` | missing-feature | **high** | `TODO(extension)`: `autoclaw.fleet.start` (template picker → registry.json → fleet boot) is complete + unit-tested but **never registered** — confirmed absent from `package.json#contributes.commands` and `extension.ts`. An onboarding-critical command is unreachable by users. |
| `src/cli/fleet-watch.ts:276` | missing-feature | med | `TODO(extension)`: register `autoclaw.watchFleet` → `watchFleetCommand({workspaceRoot})` + bind the returned disposable. Command implemented + tested (`src/test/fleet-watch.test.ts`), unwired. |

## mcp/ — 6 lines, 3 items

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/mcp/tools.ts:603,611` | missing-feature | med | `ai.todos` MCP tool returns `not_implemented` — depends on a `.autoclaw/spider/todos.json` index nothing produces yet. The producer already exists in essence: the dream pipeline's `spider()` (`src/skills/dream/pipeline.ts:343`) collects exactly these items but never persists them. |
| `src/mcp/tools.ts:669` | missing-feature | med | `TODO(BP2+)`: `recall.query` uses a placeholder recall path; swap to a real recall index once the KG bridge lands. |
| `src/mcp/server.ts:15` | cleanup | med | `TODO(BP2)`: hand-rolled MCP server; swap to `@modelcontextprotocol/sdk` once the dependency is approved (protocol-drift risk stays until then). |
| `src/mcp/tools.ts:592-593` | noise | low | Tool *description string* mentioning the TODO spider — text, not a work item (tracked via :603 above). |

## lmd/ — 5 lines, 2 items

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/lmd/natsGossip.ts:161,197` | missing-feature | med | `TODO(nats)`: NATS connection/subscribe (:161) and publish (:197) are stubbed; transport silently degrades to the filesystem ring (honest log at :186). Fine locally; blocks true multi-host gossip. |
| `src/lmd/natsGossip.ts:221` | missing-feature | low | `TODO(nats)`: `drain()` on close once the real connection exists. |
| `src/lmd/natsGossip.ts:21,186` | noise / doc | low | Module doc + fallback log message describing the stub above. |

## root — `src/extension.ts` (10), `src/autobuild.ts` (1), `src/kdream-helpers.ts` (12)

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/extension.ts:741` | question / cleanup | med | "TODO: gate the rest of the pro/team commands from the refactor spec Step 11 (orchestrate.assign/review/merge, autobuild.tail, fleet.metrics, voidspec.sync, program.*, cloud.*, bridge.*)". **Partially superseded**: :755-758 gates the orchestrate action commands and *deliberately* leaves bridge/cloud/program ungated (coordination must stay free). Needs a decision sweep: gate the remainder or rewrite the TODO to match the deliberate policy. |
| `src/extension.ts:2193` | bug-risk | low | "TODO resolution - simplified, assume resolved if not in current scan" + `todoResolutionRate = 0` placeholder (:2196) — the dashboard presents a fabricated 0% metric; needs scan-history persistence or the stat hidden. |
| `src/extension.ts:2240,2246,2343,2458,2472,2630,2634,2636` | noise | low | The TODO-*scan feature's own* code/strings (progress title, worktree-exclusion comment, webview scan trigger, toasts). |
| `src/autobuild.ts:933` | noise | low | `PLACEHOLDER_RUN_RE` regex intentionally matches `TODO\b|FIXME\b` to reject placeholder workflow steps. |
| `src/kdream-helpers.ts:29,182-252` (12 lines) | noise | low | The TODO scanner itself: `TodoItem` type, `parseTodos` regex, `TODO_SCAN_EXCLUDE_DIRS`/globs (the iteration-2 worktree-flood fix). |

## skills/dream/ — 15 lines, 1 item

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/skills/dream/register.ts:42` | missing-feature | med | `TODO(extension-session)`: `registerMemorySkills` (`autoclaw.dream` / `autoclaw.recall`) is never called from `activate()` — confirmed no registration exists. `/dream` + `/recall` are dead code until wired with real workspace data. |
| `src/skills/dream/pipeline.ts:11,319-544` (14 lines) | noise | low | Stage-5 spider implementation (TODO-family regex, micro-PR picker, trace strings) — the scanner, not open work. |

## bridge/ — 2 lines, 2 items

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/bridge/kilocode.ts:51` | cleanup / bug-risk | low | `TODO(chokidar)`: replace `fs.watch` body when chokidar becomes a dependency — OS-varying watch semantics are mitigated by `existsSync` re-check + 50ms coalescing. |
| `src/bridge/kilocode.ts:93` | cleanup | low | `TODO(vscode-typings)`: tighten the lazy `VsCodeShim` to `import type` if the build ever targets the ext host exclusively. Deliberate testability seam. |

## cloud/ — 2 lines, 1 item

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/cloud/auth.ts:117` | cleanup | low | `TODO(keytar-dep)`: structural `KeytarModule` interface + lazy `require`; replace with static import if keytar is ever promoted to a real dependency. Fallback (encrypted file store) works; low risk. |
| `src/cloud/auth.ts:20` | noise / doc | low | Cross-reference to the same TODO. |

## panel/ — 2 lines, 1 item

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/panel/fleetPanel.ts:14,313` | missing-feature / question | med | `TODO(extension.ts)`: `registerFleetPanel(context)` is never called anywhere — the FleetPanel webview is dead code. Note the repo deliberately ships **two** panel webviews and the visible sidebar is `KDreamViewProvider`; decide wire-or-retire. |

## program/ — 1 line, 1 item

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/program/registry.ts:451` | missing-feature | med | `TODO(extension.ts)`: `autoclaw.addRepoToProgram` (folder picker → program registry) implemented but unregistered in `extension.ts` / `package.json`. Multi-project orchestration entry point unreachable from the UI. |

## runners/ — 2 lines, 1 item

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/runners/claude-code.ts:11,168` | cleanup / missing-feature | med | "TODO: swap to Claude Agent SDK when dependency approved" — current runner shells out; SDK would give structured streaming/tool events. Blocked on a dependency decision, not code. |

## statusbar/ + voidspec/ — 2 lines, 2 stale comments

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/statusbar/statusBar.ts:116` | cleanup | low | **STALE**: TODO says extension.ts must call `registerFleetStatusBar` — it already does (`src/extension.ts:444`). Delete the comment. |
| `src/voidspec/dispatch.ts:19` | cleanup | low | **STALE**: TODO(extension) note, but `autoclaw.voidspec.sync` is already registered (`src/extension.ts:943`). Delete/refresh the note. |

## support/ — 1 line, 1 item

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/support/supportConfig.ts:45` | doc-gap | med | `TODO(maintainer)`: real Square links (or settings) still placeholders — a known monetization go-live gate; maintainer action, not code. |

## keepalive/ — 1 line, 1 item

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/keepalive/computerUse.ts:71` | missing-feature | low | `TODO(playwright-dep)`: `@playwright/test` deliberately not in package.json; `computer_use` strategy degrades to clean `skipped` until the operator opts in. Working as designed. |

## daemon/ — 1 line, noise

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/daemon/webui.ts:385` | noise | low | `placeholder="XXXXX-XXXXX"` — pairing-code input mask, not a marker. |

## intelligence/ — 5 lines, noise

| file:line | type | sev | text / assessment |
|---|---|---|---|
| `src/intelligence/toolScaffold.ts:57,65,69,72,75` | noise | low | Generated-scaffold template deliberately emits `TODO:` placeholders into *new* skill files (asserted by tests). Not open work in this repo. |

## test/ — 64 lines, all noise (fixtures / scanner tests)

| file:lines | type | sev | text / assessment |
|---|---|---|---|
| `src/test/qr.test.ts:30-74,308` (31) | noise | low | QR-code pixel-art expectation strings (`X`/`-` grids). |
| `src/test/extension.test.ts:23,280-321,626-673` (17) | noise | low | Tests *of* the TODO parser + the worktree-flood exclusion set. |
| `src/test/memory.test.ts:254-284` (9) | noise | low | Tests of the dream-pipeline spider / micro-PR picker (TODO fixtures). |
| `src/test/autobuild.test.ts:503,510,513` (3) | noise | low | Placeholder-step rejection fixtures (`"TODO customize me"`). |
| `src/test/analytics.test.ts:171` · `biscuit.test.ts:31` · `intelligence-redact.test.ts:178` · `intelligence-toolscaffold.test.ts:46` (4) | noise | low | Fixture strings (`XXXX` tamper suffix, sample TODO text, scaffold assertion). |

---

## Top 10 next-value items

Ranked for a continuous-dev loop. Criteria: real bug-risk / state-mutation gaps in core
coordination first, then built-but-unwired user-facing features (the repo's known
"gap is WIRING, not missing features" pattern), then honesty/stub gaps.

1. **`src/fleet/evict.ts:344` — evicted agents' tasks strand.** The "unclaim + re-dispatch released tasks + finding_report per blocked dependent" step is delegated to a command layer that isn't wired. *Fix: have the evict command call the orchestrator's existing expired-claim→unclaimed path for each `released_tasks` entry and emit one `finding_report` per `blocked_dependents` entry.*
2. **`src/fleet/evict.ts:357` — consensus can deadlock after evict.** Surviving-voter 2/3 recompute is never triggered. *Fix: after `reconcile_consensus`, invoke `resolvePendingConsensus` with the shrunken expected-voter set and raise a `finding_report` (never auto-shrink) for security/unanimous items.*
3. **`src/fleet/evict.ts:267` — §5 signing gate for remote evict.** Fail-closed today, but blocks the cross-machine control plane; naive unblocking would create a forgeable remote-kill. *Fix: reuse CP-6.1 `src/spine/sign.ts` (Ed25519 whole-envelope sign/verify + ReplayGuard) to sign a single-use TTL'd `{intent_id,target,mode,issued_at,expires}` and verify before honoring `opts.remote`.*
4. **`src/cli/fleet-templates.ts:309` — `autoclaw.fleet.start` unreachable.** Onboarding-critical fleet-boot command is complete + tested but absent from `package.json` and `activate()`. *Fix: add the `contributes.commands` entry and the `registerCommand` block the TODO already spells out.*
5. **`src/skills/dream/register.ts:42` — `/dream` + `/recall` dead code.** `registerMemorySkills` is never called. *Fix: call it from `activate()` with a `vscode.commands.registerCommand`-backed registrar and real workspace data (`.autoclaw/memory/` facts, transcripts).*
6. **`src/cli/fleet-watch.ts:276` — `autoclaw.watchFleet` unregistered.** Watcher toggle implemented + tested, invisible to users. *Fix: register the command and push the returned disposable to `context.subscriptions`.*
7. **`src/program/registry.ts:451` — `autoclaw.addRepoToProgram` unregistered.** Multi-project UI entry point missing. *Fix: register per the in-comment snippet + package.json contribution.*
8. **`src/extension.ts:741` — pro/team gating sweep unfinished/ambiguous.** The TODO lists commands (`program.*`, `cloud.*`, `bridge.*`) that :755 deliberately exempts. *Fix: reconcile against refactor-spec Step 11 — apply `withGate` to genuinely-Pro items (e.g. `autobuild.tail`, `fleet.metrics`) and rewrite the TODO to record the exemption decision.*
9. **`src/mcp/tools.ts:603` — `ai.todos` MCP tool permanently `not_implemented`.** *Fix: persist the dream pipeline's existing `spider()` output to `.autoclaw/spider/todos.json` (small bridge) so the tool's read path lights up — this very triage is the consumer use-case.*
10. **`src/extension.ts:2193` — dashboard fabricates a 0% TODO-resolution rate.** *Fix: persist per-scan `{timestamp, count, hashes}` history and compute a real rate — or hide the stat until data exists (honest-reporting rule).*

**Runners-up:** `src/mcp/server.ts:15` (adopt `@modelcontextprotocol/sdk`), `src/lmd/natsGossip.ts:161` (finish or explicitly descope the NATS transport), `src/panel/fleetPanel.ts:14` (wire-or-retire the second webview), `src/fleet/evict.ts:76` (extend intent envelope to spawn/invite/pause), `src/support/supportConfig.ts:45` (maintainer-blocked Square links).

**Free wins (stale-comment deletions):** `src/statusbar/statusBar.ts:116` and `src/voidspec/dispatch.ts:19` — both TODOs are already satisfied in `src/extension.ts` (:444, :943).

---

## Verification pass (Opus, 2026-07-10) — adversarial check of the Fable triage

Confirmed / corrected the top items rather than trusting the subagent's self-report:

| Item | Claim | Verdict |
|---|---|---|
| 5 · `registerMemorySkills` | never called from `activate()` → `autoclaw.dream`/`recall` dead | **CONFIRMED** — defined `src/skills/dream/register.ts:49`, exported `src/skills/index.ts:13`, zero call sites |
| 4 · `autoclaw.fleet.start` | not registered | **CONFIRMED** — absent from package.json |
| 6 · `autoclaw.watchFleet` | not registered | **CONFIRMED** — absent from package.json |
| — · `registerFleetPanel` | "wire-or-retire" | **NOT A BUG (by design)** — docstring at fleetPanel.ts:11 says it intentionally does not auto-wire; visible sidebar is `KDreamViewProvider` (two-webview design). Needs a product decision, do NOT auto-wire. |
| — · statusBar.ts:116 / voidspec/dispatch.ts:19 "stale" | already wired | **UNVERIFIED** this pass; statusBar.ts may be a peer (codex) scope — do not edit unattended |

### Collision constraint (why these aren't auto-fixed here)
Items 4/5/6/7/8/10 all edit `src/extension.ts` and/or `package.json`, which are **actively contested by live peer sessions** (orchestrator-loop + autobuild heartbeats seen this session; codex sessions historically own extension.ts). Per the shared-checkout hazard rule, these fixes must be done in a **git worktree** (isolated) or a **claimed/attended** session with explicit-path staging — never raced against peers on the shared checkout. Lower-collision candidates (e.g. item 9, `src/mcp/tools.ts`) are preferable for unattended cycles.
