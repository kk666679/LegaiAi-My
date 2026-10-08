import fs from 'fs';
import path from 'path';
import * as seatAudition_1 from '../fleet/seatAudition.js'; // MISSING TARGET
import * as seatAuditionFixtures_1 from '../fleet/seatAuditionFixtures.js'; // MISSING TARGET

/**
 * seat-audition.ts — CP-5.4 shadow-audition CLI runner.
 *
 * The public bar for every seat tier is deterministic, data-only, and runnable
 * offline by an external candidate WITHOUT entitlements (spec §3.7: "an external
 * candidate can self-test without entitlements"). This is the thin CLI wrapper
 * around the pure `fleet/seatAudition.ts` scorer + the public fixtures in
 * `fleet/seatAuditionFixtures.ts` — no network, no license check, no workspace
 * required.
 *
 *   node out/cli/seat-audition.js --fixture pm-tier0-review-backlog-v1 \
 *     --submission ./my-submission.json [--out ./seat-evaluated.json]
 *
 * A submission file is a JSON document shaped like `SeatAuditionSubmission`
 * (`agent_id`, `session_id`, `narrative`, optional `attention_queue[]` /
 * `risk_notes[]`) — see docs/specs/control-plane-program/seat-audition-howto.md.
 *
 * Every fs-touching step (argv parsing, file IO, formatting) is kept thin
 * around the pure {@link runSeatAudition}, which the CLI's own tests exercise
 * without touching disk (see `src/test/seats.test.ts`).
 *
 * NO LLM calls, NO network, NO entitlement check — this is the free/public floor.
 */
Object.defineProperty(exports, "__esModule", { value: true });

/* -------------------------------------------------------------------------- */
/*  Fixture lookup + submission validation (pure)                             */
/* -------------------------------------------------------------------------- */
/** Find a public fixture by id. Returns undefined for an unknown id. */
function findSeatAuditionFixture(fixtureId) {
    return seatAuditionFixtures_1.PUBLIC_SEAT_AUDITION_FIXTURES.find((f) => f.fixture_id === fixtureId);
}
/**
 * Validate the shape of a parsed submission JSON document before it is trusted
 * as a {@link SeatAuditionSubmission}. Mirrors the style of `seats.ts`'
 * validators: returns a problem list (empty = valid).
 */
function validateSeatAuditionSubmissionShape(raw) {
    const problems = [];
    if (!raw || typeof raw !== 'object') {
        return ['submission is not an object'];
    }
    const s = raw;
    if (typeof s.agent_id !== 'string' || s.agent_id.trim().length === 0) {
        problems.push('agent_id required');
    }
    if (typeof s.session_id !== 'string' || s.session_id.trim().length === 0) {
        problems.push('session_id required');
    }
    if (typeof s.narrative !== 'string' || s.narrative.trim().length === 0) {
        problems.push('narrative required');
    }
    if (s.attention_queue !== undefined
        && (!Array.isArray(s.attention_queue) || s.attention_queue.some((v) => typeof v !== 'string'))) {
        problems.push('attention_queue must be a string array when present');
    }
    if (s.risk_notes !== undefined
        && (!Array.isArray(s.risk_notes) || s.risk_notes.some((v) => typeof v !== 'string'))) {
        problems.push('risk_notes must be a string array when present');
    }
    return problems;
}
function isSeatAuditionSubmission(raw) {
    return validateSeatAuditionSubmissionShape(raw).length === 0;
}
/**
 * Build a synthetic shadow-audition "lease" from the fixture + submission so
 * {@link seatAuditionEvaluatedEvent} can project a `seat.evaluated` event. This
 * is NEVER a real occupancy lease (nothing is written to `comms/seats/`) — a
 * shadow audition never claims the seat, per spec §3.7.
 */
function buildShadowAuditionLease(fixture, submission, now) {
    const stamp = new Date(now).toISOString();
    return {
        seat_id: fixture.seat_id,
        agent_id: submission.agent_id,
        session_id: submission.session_id,
        tier: fixture.tier,
        since: stamp,
        lease_expires: stamp,
        reason: `shadow audition: ${fixture.fixture_id}`,
    };
}
/**
 * Score a submission against a public fixture and project the `seat.evaluated`
 * spine event — pure, no fs, no network, deterministic given the same inputs.
 * This is the function the CLI wraps with argv parsing and file IO, and the one
 * unit-tested directly (see `src/test/seats.test.ts`).
 */
function runSeatAudition(opts) {
    const fixture = findSeatAuditionFixture(opts.fixtureId);
    if (!fixture) {
        return {
            ok: false,
            reason: 'unknown_fixture',
            problems: [`no public fixture named "${opts.fixtureId}"; known: ${(0, seatAuditionFixtures_1.publicSeatAuditionFixtureIds)().join(', ')}`],
        };
    }
    const fixtureProblems = (0, seatAudition_1.validateSeatAuditionFixture)(fixture);
    if (fixtureProblems.length > 0) {
        return { ok: false, reason: 'invalid_fixture', problems: fixtureProblems };
    }
    const submissionProblems = validateSeatAuditionSubmissionShape(opts.submission);
    if (submissionProblems.length > 0) {
        return { ok: false, reason: 'invalid_submission', problems: submissionProblems };
    }
    const submission = opts.submission;
    const now = opts.now ?? Date.now();
    const result = (0, seatAudition_1.scoreSeatAudition)(fixture, submission);
    const lease = buildShadowAuditionLease(fixture, submission, now);
    const event = (0, seatAudition_1.seatAuditionEvaluatedEvent)(lease, result, {
        workspace_id: opts.workspaceId ?? 'offline-audition',
        observed_at: new Date(now).toISOString(),
        occurred_at: new Date(now).toISOString(),
        producer: 'seat-audition-cli',
    });
    return { ok: true, fixture, result, event };
}
/* -------------------------------------------------------------------------- */
/*  Report formatting (pure)                                                 */
/* -------------------------------------------------------------------------- */
/** Human-readable report for stdout. */
function formatSeatAuditionReport(result) {
    const lines = [
        `Seat audition: ${result.fixture_id} (seat=${result.seat_id}, tier=${result.tier})`,
        `Candidate: ${result.agent_id} / session ${result.session_id}`,
        result.summary,
    ];
    if (result.findings.length > 0) {
        lines.push('Findings:');
        for (const f of result.findings) {
            lines.push(`  - ${f.kind} (${f.bucket}): "${f.term}"`);
        }
    }
    return lines.join('\n');
}
/** Parse `--fixture <id> --submission <path> [--out <path>]`. Pure, testable. */
function parseSeatAuditionArgs(argv) {
    const arg = (name) => {
        const i = argv.indexOf(name);
        return i >= 0 && argv[i + 1] ? argv[i + 1] : undefined;
    };
    return {
        fixtureId: arg('--fixture'),
        submissionPath: arg('--submission'),
        outPath: arg('--out'),
    };
}
/* -------------------------------------------------------------------------- */
/*  CLI entry point                                                           */
/* -------------------------------------------------------------------------- */
const USAGE = 'usage: seat-audition --fixture <fixture_id> --submission <path.json> [--out <event.json>]\n' +
    `known fixtures: ${(0, seatAuditionFixtures_1.publicSeatAuditionFixtureIds)().join(', ')}`;
/**
 * `node out/cli/seat-audition.js` entry point. Reads the submission JSON from
 * disk, scores it against the named public fixture, prints the report, and
 * writes (or prints) the `seat.evaluated` event JSON. Exit code is 0 when the
 * audition passed, 1 on any failure (unknown fixture, bad submission shape, or
 * a failing score) — so the runner composes cleanly into a CI gate.
 */
async function main(argv = process.argv.slice(2)) {
    const args = parseSeatAuditionArgs(argv);
    if (!args.fixtureId || !args.submissionPath) {
        console.error(USAGE);
        process.exitCode = 1;
        return;
    }
    let raw;
    try {
        raw = JSON.parse(fs.readFileSync(path.resolve(args.submissionPath), 'utf8'));
    }
    catch (err) {
        console.error(`seat-audition: failed to read submission "${args.submissionPath}": ${err instanceof Error ? err.message : String(err)}`);
        process.exitCode = 1;
        return;
    }
    const run = runSeatAudition({ fixtureId: args.fixtureId, submission: raw });
    if (!run.ok) {
        console.error(`seat-audition: ${run.reason}: ${run.problems.join('; ')}`);
        process.exitCode = 1;
        return;
    }
    console.log(formatSeatAuditionReport(run.result));
    const eventJson = JSON.stringify(run.event, null, 2);
    if (args.outPath) {
        fs.writeFileSync(path.resolve(args.outPath), eventJson + '\n', 'utf8');
        console.log(`\nseat.evaluated event written to ${args.outPath}`);
    }
    else {
        console.log('\nseat.evaluated event:');
        console.log(eventJson);
    }
    process.exitCode = run.result.passed ? 0 : 1;
}
// Run as a CLI when invoked directly (not when imported by tests).
if (require.main === module) {
    void main().catch((err) => {
        console.error('seat-audition: fatal error:', err instanceof Error ? err.message : err);
        process.exitCode = 1;
    });
}
//# sourceMappingURL=seat-audition.js.map

export { findSeatAuditionFixture as findSeatAuditionFixture, validateSeatAuditionSubmissionShape as validateSeatAuditionSubmissionShape, isSeatAuditionSubmission as isSeatAuditionSubmission, buildShadowAuditionLease as buildShadowAuditionLease, runSeatAudition as runSeatAudition, formatSeatAuditionReport as formatSeatAuditionReport, parseSeatAuditionArgs as parseSeatAuditionArgs, main as main };
