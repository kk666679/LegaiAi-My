import fs from 'fs';
import path from 'path';
import * as experiment_1 from './playbooks/experiment.js';
import * as promotion_1 from './playbooks/promotion.js';
import * as workflowExecutor_1 from './playbooks/workflowExecutor.js';
import * as runner_1 from './runner.js';
import scaffolds_1 from './scaffolds/index.js';
import * as ledger_1 from './traces/ledger.js';

/**
 * awlService.ts — Adaptive Workflow Learning cycle service (AWL-RUN-1).
 *
 * The Ornith/LongCat wave shipped a complete, tested scaffold-learning library
 * (select → mutate → execute → guard → score → trace → promote) that nothing
 * user-reachable ran. This module is the missing conductor: ONE bounded AWL
 * cycle over the existing seams, returning a structured report.
 *
 *   load stores (variants/scores/harnesses + recent traces)
 *     → run {@link runPlaybookExperiment} once per eligible (intent, profile)
 *       group, executing through {@link buildAutoWorkflowExecutor} (offline
 *       mock unless a live executor is injected)
 *     → apply the AWL-3 promotion policy ({@link evaluatePromotions}) over the
 *       RECORDED outcome history — its integrity gates and min-sample
 *       requirement are used verbatim, never weakened
 *     → persist policy-promoted children via the existing scaffold store
 *     → render + write a markdown report under .autoclaw/orchestrator/reports/.
 *
 * HONESTY RULES built into this service:
 *   - With the default OFFLINE executor (refusing command runner + mock model
 *     provider), experiment scores/traces are reported but NEVER persisted:
 *     mock outcomes must not pollute the promotion policy's evidence base.
 *     Live learning requires injecting `io.execute` (the production seam).
 *   - The promotion policy is evaluated over recorded scores plus scores that
 *     were actually persisted this cycle — never over unpersisted mock runs.
 *   - `dryRun: true` evaluates and reports but persists nothing at all
 *     (no scores, no traces, no variants, no report file).
 *
 * Pure logic + injected I/O. No vscode import — the command glue lives in
 * ./awlCommand.ts and the orchestrator hook takes its config gate as a value.
 */
Object.defineProperty(exports, "__esModule", { value: true });
export const AWL_AUTO_EXPERIMENT_SETTING = exports.AWL_AUTO_MARKER_FILE = exports.AWL_REPORTS_DIR = void 0;
/* -------------------------------------------------------------------------- */
/*  Paths & constants                                                         */
/* -------------------------------------------------------------------------- */
/** Where cycle reports land (shared with other orchestrator report surfaces). */
export const AWL_REPORTS_DIR = path.join('.autoclaw', 'orchestrator', 'reports');
/** Marker file the auto-hook uses to rate-limit cycles. */
export const AWL_AUTO_MARKER_FILE = 'awl-last-cycle.json';
/** Settings key gating the auto-hook (read by the CALLER; default false). */
export const AWL_AUTO_EXPERIMENT_SETTING = 'autoclaw.workflows.autoExperiment';
/** Filesystem-safe fragment of an ISO timestamp (mirrors comms conventions). */
function timestampFragment(iso) {
    return iso.replace(/[:.]/g, '-');
}
/** Absolute path of the report file for a cycle started at `nowIso`. */
function awlCycleReportPath(workspaceRoot, nowIso) {
    return path.join(workspaceRoot, exports.AWL_REPORTS_DIR, `awl-cycle-${timestampFragment(nowIso)}.md`);
}
/** Absolute path of the auto-hook rate-limit marker. */
function awlAutoMarkerPath(workspaceRoot) {
    return path.join(workspaceRoot, exports.AWL_REPORTS_DIR, exports.AWL_AUTO_MARKER_FILE);
}
/* -------------------------------------------------------------------------- */
/*  runAwlExperimentCycle                                                     */
/* -------------------------------------------------------------------------- */
const DEFAULT_MAX_EXPERIMENTS = 3;
const RECENT_TRACES_LIMIT = 500;
async function runAwlExperimentCycle(opts) {
    const t0 = Date.now();
    const log = opts.log ?? (() => undefined);
    const io = opts.io ?? {};
    const dryRun = opts.dryRun === true;
    const liveExecutor = typeof io.execute === 'function';
    const warnings = [];
    const skippedReasons = [];
    // ── 1. Load the evidence base ─────────────────────────────────────────────
    let variants = [];
    let recordedScores = [];
    let harnesses = [];
    let recentTraces = [];
    try {
        variants = await (io.readVariants ?? (async () => (await (0, scaffolds_1.readScaffoldVariants)(opts.workspaceRoot)).records))();
    }
    catch (err) {
        warnings.push(`variants unreadable: ${err.message}`);
    }
    try {
        recordedScores = await (io.readScores ?? (async () => (await (0, scaffolds_1.readScaffoldScores)(opts.workspaceRoot)).records))();
    }
    catch (err) {
        warnings.push(`scores unreadable: ${err.message}`);
    }
    try {
        harnesses = await (io.readHarnesses ?? (async () => (await (0, scaffolds_1.readPromptHarnessContracts)(opts.workspaceRoot)).records))();
    }
    catch (err) {
        warnings.push(`harnesses unreadable: ${err.message}`);
    }
    try {
        recentTraces = await (io.readRecentTraces ?? (() => (0, ledger_1.readTraces)(opts.workspaceRoot, { limit: RECENT_TRACES_LIMIT })))();
    }
    catch (err) {
        warnings.push(`traces unreadable: ${err.message}`);
    }
    log(`AWL cycle: ${variants.length} playbook(s), ${recordedScores.length} recorded score(s), ${recentTraces.length} recent trace row(s)`);
    // ── 2. Eligible groups: distinct (intent, profile), deterministic order ──
    const groupKeys = [...new Set(variants.map((v) => `${v.taskIntent}|${v.routerProfile}`))].sort();
    const maxExperiments = Math.max(0, opts.maxExperiments ?? DEFAULT_MAX_EXPERIMENTS);
    if (variants.length === 0) {
        skippedReasons.push('no playbook variants found under .autoclaw/workflows/scaffolds/variants.jsonl — seed at least one playbook to experiment on');
    }
    if (groupKeys.length > maxExperiments) {
        skippedReasons.push(`capped at ${maxExperiments} experiment(s) this cycle; ${groupKeys.length - maxExperiments} eligible intent/profile group(s) deferred`);
    }
    const groups = groupKeys.slice(0, maxExperiments).map((key) => {
        const [intent, profile] = key.split('|');
        return { intent, profile };
    });
    // ── 3. Experiment sinks: persist only when honest to do so ───────────────
    // Mock-executor outcomes must not enter the recorded evidence base.
    const persistExperiments = !dryRun && liveExecutor;
    if (dryRun) {
        skippedReasons.push('dry run — no scores, traces, variants, or report file were persisted');
    }
    else if (!liveExecutor && groups.length > 0) {
        skippedReasons.push('offline mock executor — experiment scores/traces were NOT persisted; inject io.execute (live executor) to record real outcomes');
    }
    const appendScoreSink = io.appendScore ?? ((s) => (0, scaffolds_1.appendScaffoldScore)(opts.workspaceRoot, s));
    const appendVariantSink = io.appendVariant ?? ((v) => (0, scaffolds_1.appendScaffoldVariant)(opts.workspaceRoot, v));
    const appendTraceSink = io.appendTrace ?? (async (row) => { await (0, ledger_1.appendTraceRow)(opts.workspaceRoot, row); });
    const publishSink = io.publishGuardFindings ?? (async (findings) => {
        await (await import('../orchestrator/findings')).writeRewardGuardFindings(findings, { workspaceRoot: opts.workspaceRoot });
    });
    const persistedCounts = { scores: 0, variants: 0, traces: 0 };
    const newScores = [];
    /** Children the experiment pass's single-run gate persisted this cycle. */
    const appendedThisCycle = new Set();
    /** Every child produced this cycle (even unpromoted), by id. */
    const cycleChildren = new Map();
    const execute = io.execute
        ?? (0, workflowExecutor_1.buildAutoWorkflowExecutor)((0, runner_1.defaultDeps)(opts.workspaceRoot), { task: opts.task ?? 'AWL experiment cycle' });
    // ── 4. One bounded experiment pass per group ─────────────────────────────
    const experiments = [];
    let experimentIndex = 0;
    for (const group of groups) {
        experimentIndex += 1;
        const runId = `awl-${timestampFragment(opts.now)}-${experimentIndex}`;
        const expDeps = {
            execute,
            // Static snapshots keep the cycle deterministic — each pass judges the
            // same evidence base it started with.
            readVariants: async () => variants,
            readScores: async () => recordedScores,
            readHarnesses: async () => harnesses,
            appendScore: async (s) => {
                newScores.push(s);
                if (persistExperiments) {
                    await appendScoreSink(s);
                    persistedCounts.scores += 1;
                }
            },
            appendVariant: async (v) => {
                if (persistExperiments) {
                    await appendVariantSink(v);
                    persistedCounts.variants += 1;
                    appendedThisCycle.add(v.id);
                }
            },
            appendTrace: async (row) => {
                if (persistExperiments) {
                    await appendTraceSink(row);
                    persistedCounts.traces += 1;
                }
            },
            publishGuardFindings: async (findings) => {
                if (persistExperiments) {
                    await publishSink(findings);
                }
            },
        };
        const res = await (0, experiment_1.runPlaybookExperiment)({
            workspaceRoot: opts.workspaceRoot,
            intent: group.intent,
            profile: group.profile,
            deps: expDeps,
            runId,
            agentId: 'awl-service',
            now: opts.now,
            ...(opts.tune ? { tune: opts.tune } : {}),
        });
        if (res.child) {
            cycleChildren.set(res.child.id, res.child);
        }
        experiments.push({
            runId,
            intent: group.intent,
            profile: group.profile,
            selectedId: res.decision.selected?.id,
            executedId: res.executed?.id,
            childId: res.child?.id,
            promotedBySingleRunGate: res.promoted,
            reward: res.score?.reward,
            pass: res.score?.pass,
            guardAllowed: res.guard?.allowed,
            reasons: res.reasons,
            warnings: res.warnings,
        });
        warnings.push(...res.warnings.map((w) => `[${runId}] ${w}`));
        log(`experiment ${runId} (${group.intent}/${group.profile}): ${res.reasons[res.reasons.length - 1] ?? 'no decision'}`);
    }
    // ── 5. Promotion policy over RECORDED evidence (never mock outcomes) ─────
    // Default thresholds only — the integrity gates and min-sample floor are
    // the policy's, verbatim.
    const policyScores = persistExperiments ? [...recordedScores, ...newScores] : recordedScores;
    const decisions = (0, promotion_1.evaluatePromotions)(policyScores);
    const storedIds = new Set(variants.map((v) => v.id));
    const promotions = [];
    const rejections = [];
    for (const decision of decisions) {
        if (decision.action !== 'promote') {
            rejections.push({
                scaffoldId: decision.scaffoldId,
                action: decision.action,
                reasons: decision.reasons,
                stats: decision.stats,
            });
            continue;
        }
        let persisted = false;
        let note;
        const child = cycleChildren.get(decision.scaffoldId);
        if (appendedThisCycle.has(decision.scaffoldId)) {
            persisted = true;
            note = 'persisted this cycle by the experiment pass (single-run gate)';
        }
        else if (storedIds.has(decision.scaffoldId)) {
            note = 'already selectable in the variants store';
        }
        else if (child && !dryRun) {
            try {
                await appendVariantSink(child);
                persistedCounts.variants += 1;
                persisted = true;
                note = 'persisted by the promotion policy over recorded history';
            }
            catch (err) {
                note = `promotion persist failed: ${err.message}`;
                warnings.push(`variant append failed for ${decision.scaffoldId}: ${err.message}`);
            }
        }
        else if (child) {
            note = 'dry run — not persisted';
        }
        else {
            note = 'definition unavailable (score history references a scaffold not in the store)';
        }
        promotions.push({
            scaffoldId: decision.scaffoldId,
            action: 'promote',
            reasons: decision.reasons,
            stats: decision.stats,
            persisted,
            note,
        });
    }
    // ── 6. Assemble + write the report ────────────────────────────────────────
    const report = {
        schema: 'autoclaw.awlCycleReport.v1',
        startedAt: opts.now,
        durationMs: Math.max(0, Date.now() - t0),
        dryRun,
        liveExecutor,
        experimentsRun: experiments.length,
        variantsScored: experiments.filter((e) => e.reward !== undefined).length,
        promotions,
        rejections,
        skippedReasons,
        experiments,
        ledger: { variants: variants.length, scores: recordedScores.length, recentTraces: recentTraces.length },
        persisted: persistedCounts,
        warnings,
    };
    if (!dryRun) {
        const reportPath = awlCycleReportPath(opts.workspaceRoot, opts.now);
        try {
            const writeReport = io.writeReport ?? (async (absPath, markdown) => {
                await fs.promises.mkdir(path.dirname(absPath), { recursive: true });
                await fs.promises.writeFile(absPath, markdown, 'utf8');
            });
            await writeReport(reportPath, renderAwlCycleMarkdown(report));
            report.reportPath = reportPath;
            log(`report written: ${reportPath}`);
        }
        catch (err) {
            report.warnings.push(`report write failed: ${err.message}`);
        }
    }
    return report;
}
/* -------------------------------------------------------------------------- */
/*  renderAwlCycleMarkdown                                                    */
/* -------------------------------------------------------------------------- */
function statsLine(stats) {
    return `samples ${stats.samples}, reward ${stats.avgReward.toFixed(2)}, pass ${Math.round(stats.passRate * 100)}%, `
        + `verifier ${Math.round(stats.verifierPassRate * 100)}%, guard ${stats.guardViolations}, scope ${stats.scopeViolations}`;
}
/** Compact markdown for an output channel or the report file. Pure. */
function renderAwlCycleMarkdown(report) {
    const lines = [];
    lines.push('# AWL Experiment Cycle');
    lines.push('');
    lines.push(`- Started: ${report.startedAt}`);
    lines.push(`- Duration: ${report.durationMs} ms`);
    lines.push(`- Mode: ${report.dryRun ? 'dry run (nothing persisted)' : report.liveExecutor ? 'live executor' : 'offline shakeout (experiment outcomes not persisted)'}`);
    lines.push(`- Experiments run: ${report.experimentsRun}`);
    lines.push(`- Variants scored: ${report.variantsScored}`);
    lines.push(`- Promotions: ${report.promotions.length}   Holds/demotions: ${report.rejections.length}`);
    lines.push(`- Evidence base: ${report.ledger.variants} playbook(s), ${report.ledger.scores} recorded score(s), ${report.ledger.recentTraces} recent trace row(s)`);
    lines.push(`- Persisted this cycle: ${report.persisted.scores} score(s), ${report.persisted.variants} variant(s), ${report.persisted.traces} trace row(s)`);
    lines.push('');
    lines.push('## Experiments');
    if (report.experiments.length === 0) {
        lines.push('_None ran._');
    }
    for (const e of report.experiments) {
        lines.push(`### ${e.runId} — ${e.intent}/${e.profile}`);
        lines.push(`- Selected: ${e.selectedId ?? 'none'}   Executed: ${e.executedId ?? 'none'}${e.childId ? `   Child: ${e.childId}` : ''}`);
        if (e.reward !== undefined) {
            lines.push(`- Reward: ${e.reward}   Pass: ${e.pass}   Guard OK: ${e.guardAllowed}`);
        }
        lines.push(`- Single-run gate promoted child: ${e.promotedBySingleRunGate ? 'yes' : 'no'}`);
        for (const r of e.reasons) {
            lines.push(`  - ${r}`);
        }
        lines.push('');
    }
    lines.push('## Promotion policy decisions');
    if (report.promotions.length === 0 && report.rejections.length === 0) {
        lines.push('_No playbook has any recorded score history yet._');
    }
    for (const p of report.promotions) {
        lines.push(`- PROMOTE \`${p.scaffoldId}\` — ${p.reasons.join('; ')} (${statsLine(p.stats)})`);
        lines.push(`  - ${p.persisted ? 'PERSISTED' : 'not persisted'}: ${p.note}`);
    }
    for (const r of report.rejections) {
        lines.push(`- ${r.action.toUpperCase()} \`${r.scaffoldId}\` — ${r.reasons.join('; ')} (${statsLine(r.stats)})`);
    }
    lines.push('');
    if (report.skippedReasons.length > 0) {
        lines.push('## Skipped');
        for (const s of report.skippedReasons) {
            lines.push(`- ${s}`);
        }
        lines.push('');
    }
    if (report.warnings.length > 0) {
        lines.push('## Warnings');
        for (const w of report.warnings) {
            lines.push(`- ${w}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
const DEFAULT_AUTO_INTERVAL_HOURS = 6;
/**
 * Config-gated, rate-limited AWL cycle for the orchestrator loop to call after
 * a completed dispatch. NEVER throws — every failure is folded into the
 * result and logged. The marker file is written BEFORE the cycle runs so a
 * crashing cycle cannot retry-loop every dispatch.
 */
async function maybeRunAwlAfterDispatch(opts) {
    const log = opts.log ?? (() => undefined);
    try {
        if (opts.enabled !== true) {
            return { ran: false, reason: `${exports.AWL_AUTO_EXPERIMENT_SETTING} is disabled` };
        }
        const nowIso = opts.now ?? new Date().toISOString();
        const nowMs = Date.parse(nowIso);
        if (!Number.isFinite(nowMs)) {
            return { ran: false, reason: `invalid timestamp: ${opts.now}` };
        }
        const intervalMs = Math.max(1, opts.minIntervalHours ?? DEFAULT_AUTO_INTERVAL_HOURS) * 3600000;
        const markerPath = awlAutoMarkerPath(opts.workspaceRoot);
        // Rate limit: at most one cycle per interval, across sessions.
        try {
            const raw = await fs.promises.readFile(markerPath, 'utf8');
            const marker = JSON.parse(raw);
            const lastMs = Date.parse(marker.at ?? '');
            if (Number.isFinite(lastMs) && nowMs - lastMs < intervalMs) {
                return { ran: false, reason: `rate-limited: last cycle at ${marker.at} (interval ${intervalMs / 3600000}h)` };
            }
        }
        catch {
            // Missing/invalid marker ⇒ eligible to run.
        }
        // Claim the slot BEFORE running: a crashing cycle must not retry-spin.
        try {
            await fs.promises.mkdir(path.dirname(markerPath), { recursive: true });
            await fs.promises.writeFile(markerPath, JSON.stringify({ at: nowIso, by: 'maybeRunAwlAfterDispatch' }) + '\n', 'utf8');
        }
        catch (err) {
            // Cannot rate-limit without the marker — skip rather than risk a loop.
            return { ran: false, reason: `marker write failed, skipping: ${err.message}` };
        }
        const runCycle = opts.runCycle ?? runAwlExperimentCycle;
        try {
            const report = await runCycle({
                workspaceRoot: opts.workspaceRoot,
                now: nowIso,
                dryRun: false,
                log,
                ...(opts.cycleOptions ?? {}),
            });
            log(`AWL auto cycle complete: ${report.experimentsRun} experiment(s), ${report.promotions.length} promotion(s)`);
            return { ran: true, reason: 'cycle completed', report };
        }
        catch (err) {
            log(`AWL auto cycle failed: ${err.message}`);
            return { ran: false, reason: `cycle failed: ${err.message}` };
        }
    }
    catch (err) {
        // Absolute backstop — this hook must never take the dispatch loop down.
        return { ran: false, reason: `hook error: ${err.message}` };
    }
}
//# sourceMappingURL=awlService.js.map

export { timestampFragment as timestampFragment, awlCycleReportPath as awlCycleReportPath, awlAutoMarkerPath as awlAutoMarkerPath, runAwlExperimentCycle as runAwlExperimentCycle, renderAwlCycleMarkdown as renderAwlCycleMarkdown, maybeRunAwlAfterDispatch as maybeRunAwlAfterDispatch };
