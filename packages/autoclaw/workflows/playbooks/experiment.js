import scaffolds_1 from '../scaffolds/index.js';
import * as promotion_1 from './promotion.js';

/**
 * experiment.ts — Playbook Experiment Runner (AWL-2, adaptive-workflow-learning).
 *
 * ONE bounded pass of the Workflow Playbook loop from the AWL spec:
 *
 *   select playbook → (optionally) tune a child variant → execute via an
 *   INJECTED executor → apply Reward Guard → score the outcome → append a
 *   Trace Ledger episode → decide promotion.
 *
 * Composition only — every capability already exists as a pure seam:
 * {@link selectScaffoldVariant} (OSL-3.1), {@link mutateScaffoldVariant}
 * (OSL-3.2), {@link evaluateScaffoldMonitor} (OSL-5.1 Reward Guard),
 * {@link buildScaffoldScore} (OSL-2.1), and the Trace Ledger (TL-1). The
 * executor is a REQUIRED injectable, so tests (and dry runs) never touch a
 * live model.
 *
 * Promotion is deliberately conservative (spec: "never auto-promotes a child
 * playbook without passing policy, reward, and verifier thresholds"): a tuned
 * child is persisted to the variants store ONLY when the mutation validated,
 * the run passed, the reward clears the threshold, the verifier passed, and
 * Reward Guard found nothing. Everything else leaves the child ephemeral —
 * scored and traced, but not selectable.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const DEFAULT_MIN_REWARD = 0.5;
/* -------------------------------------------------------------------------- */
/*  Default store/ledger wiring (lazy — tests never touch it)                 */
/* -------------------------------------------------------------------------- */
function defaultDeps(workspaceRoot) {
    return {
        readVariants: async () => (await import('../scaffolds/store.js)).readScaffoldVariants(workspaceRoot).then((r) => r.records),
        readScores: async (') => (await import('../scaffolds/store.js)).readScaffoldScores(workspaceRoot).then((r) => r.records),
        readHarnesses: async (') => (await import('../scaffolds/store.js)).readPromptHarnessContracts(workspaceRoot).then((r) => r.records),
        monitor: scaffolds_1.evaluateScaffoldMonitor,
        appendScore: async (score') => (await import('../scaffolds/store.js)).appendScaffoldScore(workspaceRoot, score),
        appendVariant: async (variant') => (await import('../scaffolds/store.js)).appendScaffoldVariant(workspaceRoot, variant),
        appendTrace: async (row') => {
            await (await import('../traces/ledger.js)).appendTraceRow(workspaceRoot, row);
        },
        publishGuardFindings: async (findings') => {
            await (await import('../../orchestrator/findings')).writeRewardGuardFindings(findings, { workspaceRoot });
        },
    };
}
/* -------------------------------------------------------------------------- */
/*  runPlaybookExperiment                                                     */
/* -------------------------------------------------------------------------- */
/**
 * One bounded experiment pass. Never throws: executor/storage failures are
 * folded into the result as failed runs or warnings, so a broken seam can't
 * take the loop down with it.
 */
async function runPlaybookExperiment(opts) {
    const now = opts.now ?? new Date().toISOString();
    const d = { ...defaultDeps(opts.workspaceRoot), ...opts.deps };
    const reasons = [];
    const warnings = [];
    // ── 1. Select ────────────────────────────────────────────────────────────
    let variants = [];
    let scores = [];
    let harnesses = [];
    try {
        variants = await d.readVariants();
    }
    catch (err) {
        warnings.push(`variants unreadable: ${err.message}`);
    }
    try {
        scores = await d.readScores();
    }
    catch (err) {
        warnings.push(`scores unreadable: ${err.message}`);
    }
    try {
        harnesses = await d.readHarnesses();
    }
    catch (err) {
        warnings.push(`harnesses unreadable: ${err.message}`);
    }
    // AWL-3 consumer: playbooks the promotion policy has demoted never reach
    // the selector. The policy is the authority; this is just enforcement.
    const demoted = new Set((0, promotion_1.evaluatePromotions)(scores)
        .filter((d) => d.action === 'demote')
        .map((d) => d.scaffoldId));
    const selectable = variants.filter((v) => !demoted.has(v.id));
    if (selectable.length < variants.length) {
        reasons.push(`filtered ${variants.length - selectable.length} demoted playbook(s): ${variants.filter((v) => demoted.has(v.id)).map((v) => v.id).join(', ')}`);
    }
    const decision = (0, scaffolds_1.selectScaffoldVariant)({
        intent: opts.intent,
        profile: opts.profile,
        variants: selectable,
        scores,
        promptHarnesses: harnesses,
        constraints: opts.constraints,
        previousFailureType: opts.previousFailureType,
        now,
    });
    if (!decision.selected) {
        reasons.push(`no playbook selected: ${decision.reason}`);
        return { decision, traced: false, promoted: false, reasons, warnings: [...warnings, ...decision.warnings] };
    }
    reasons.push(`selected ${decision.selected.id}: ${decision.reason}`);
    // ── 2. Tune (optional) ───────────────────────────────────────────────────
    let child;
    let executed = decision.selected;
    let tuneValid = false;
    if (opts.tune) {
        const mutation = (0, scaffolds_1.mutateScaffoldVariant)({ ...opts.tune, base: decision.selected, createdAt: now });
        if (mutation.ok && mutation.scaffold) {
            child = mutation.scaffold;
            executed = child;
            tuneValid = true;
            reasons.push(`tuned child ${child.id} (${opts.tune.kind})`);
        }
        else {
            reasons.push(`tune rejected (${mutation.diagnostics.map((x) => x.code).join(', ') || 'invalid'}) — running the parent unchanged`);
        }
    }
    // ── 3. Execute (injected) ────────────────────────────────────────────────
    let execution;
    try {
        execution = await opts.deps.execute(executed);
    }
    catch (err) {
        execution = { run: { runId: opts.runId, status: 'failed' } };
        reasons.push(`executor failed: ${err.message}`);
    }
    const run = { runId: opts.runId, ...execution.run };
    // ── 4. Reward Guard ──────────────────────────────────────────────────────
    const guard = d.monitor({
        agentId: opts.agentId,
        taskId: opts.taskId,
        scaffoldId: executed.id,
        scopeGlobs: opts.scopeGlobs,
        reads: execution.accesses?.reads,
        writes: execution.accesses?.writes,
        allowedWriteGlobs: execution.accesses?.allowedWriteGlobs,
        now,
    });
    if (!guard.allowed) {
        reasons.push(`reward guard: ${guard.violations.map((v) => v.kind).join(', ')}`);
        // VFY-2 consumer: violations become finding reports on the comms bus so
        // the board/review surfaces see them. Best-effort — never blocks the pass.
        try {
            await d.publishGuardFindings(guard.findings);
        }
        catch (err) {
            warnings.push(`guard finding publish failed: ${err.message}`);
        }
    }
    // ── 5. Score ─────────────────────────────────────────────────────────────
    const { buildScaffoldScore } = await import('../scaffolds/score.js);
    const scored = buildScaffoldScore({
        scaffold: executed,
        run,
        review: execution.review,
        antiHackingViolation: guard.violations[0],
        createdAt: now,
    });
    warnings.push(...scored.warnings);
    if (scored.score) {
        try {
            await d.appendScore(scored.score);
        }
        catch (err) {
            warnings.push(`score append failed: ${err.message}`);
        }
        reasons.push(`scored reward ${scored.score.reward} (pass=${scored.score.pass})`');
    }
    // ── 6. Trace ─────────────────────────────────────────────────────────────
    const { buildTraceRow } = await import('../traces/ledger.js');
    let traced = false;
    try {
        await d.appendTrace(buildTraceRow({
            agent_id: opts.agentId ?? 'playbook-experiment',
            session_id: opts.sessionId,
            task_id: opts.taskId,
            run_id: opts.runId,
            at: now,
            playbook_id: executed.id,
            playbook_parent_id: executed.parentScaffoldId,
            harness_id: executed.promptHarnessId,
            outcome: run.status === 'completed' ? 'completed' : run.status === 'human_required' ? 'partial' : 'failed',
            reward: scored.score?.reward,
            guard_findings: guard.violations.map((v) => ({
                kind: v.kind, severity: v.severity, summary: v.summary, path: v.path,
            })),
            usage: { cost_cents: run.costCents, estimated: true },
            duration_ms: run.durationMs,
            retries: run.retryCount,
        }));
        traced = true;
    }
    catch (err) {
        warnings.push(`trace append failed: ${err.message}`);
    }
    // ── 7. Promotion (children only, thresholds mandatory) ──────────────────
    let promoted = false;
    if (child && tuneValid) {
        const minReward = opts.thresholds?.minReward ?? DEFAULT_MIN_REWARD;
        const needVerifier = opts.thresholds?.requireVerifierPass ?? true;
        const s = scored.score;
        const blockers = [];
        if (!s) {
            blockers.push('no score');
        }
        if (s && !s.pass) {
            blockers.push('run did not pass');
        }
        if (s && s.reward < minReward) {
            blockers.push(`reward ${s.reward} < ${minReward}`);
        }
        if (needVerifier && !(s?.verifierPass)) {
            blockers.push('verifier did not pass');
        }
        if (!guard.allowed) {
            blockers.push('reward-guard violation');
        }
        if (blockers.length === 0) {
            try {
                await d.appendVariant(child);
                promoted = true;
                reasons.push(`promoted child ${child.id}`);
            }
            catch (err) {
                warnings.push(`promotion append failed: ${err.message}`);
                reasons.push('promotion blocked: variant store write failed');
            }
        }
        else {
            reasons.push(`promotion blocked: ${blockers.join('; ')}`);
        }
    }
    return { decision, executed, child, guard, score: scored.score, traced, promoted, reasons, warnings };
}
//# sourceMappingURL=experiment.js.map

export { runPlaybookExperiment as runPlaybookExperiment };
