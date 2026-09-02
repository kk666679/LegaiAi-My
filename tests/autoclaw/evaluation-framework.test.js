import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGoldDataset,
  evaluateAgainstGold,
  createAdversarialTests,
  runAdversarialTest,
  buildMetricsSnapshot,
} from '../../.autoclaw/eval/evaluation-framework.js';

test('createGoldDataset returns 4 test cases across legal domains', () => {
  const gold = createGoldDataset();

  assert.equal(gold.length, 4);
  assert.ok(gold.some((g) => g.category === 'company-law'));
  assert.ok(gold.some((g) => g.category === 'employment'));
  assert.ok(gold.some((g) => g.category === 'constitutional'));
  assert.ok(gold.some((g) => g.category === 'contract-law'));
});

test('createGoldDataset specifies expected outcomes for validation', () => {
  const gold = createGoldDataset();
  const first = gold[0];

  assert.ok(first.expectedCitations);
  assert.ok(first.expectedDomain);
  assert.ok(first.expectedConfidenceMin);
  assert.ok(first.expectedIssue);
});

test('evaluateAgainstGold detects correct domain classification', () => {
  const gold = createGoldDataset()[0]; // company law case
  const output = {
    irac: {
      issue: { domain: 'company' },
      conclusion: { qualifiers: [] },
    },
    avgConfidence: 0.75,
    validationResult: [],
  };

  const result = evaluateAgainstGold(output, gold);

  const domainCheck = result.successes.find((s) => s.metric === 'domain_detection');
  assert.ok(domainCheck);
  assert.equal(domainCheck.passed, true);
});

test('evaluateAgainstGold flags wrong domain classification', () => {
  const gold = createGoldDataset()[0];
  const output = {
    irac: {
      issue: { domain: 'criminal' }, // wrong
      conclusion: { qualifiers: [] },
    },
    avgConfidence: 0.75,
    validationResult: [],
  };

  const result = evaluateAgainstGold(output, gold);

  const domainCheck = result.issues.find((i) => i.metric === 'domain_detection');
  assert.ok(domainCheck);
  assert.equal(domainCheck.passed, false);
});

test('evaluateAgainstGold validates confidence thresholds', () => {
  const gold = createGoldDataset()[0];
  const lowConfidenceOutput = {
    irac: { issue: { domain: 'company' }, conclusion: { qualifiers: [] } },
    avgConfidence: 0.5, // below threshold
    validationResult: [],
  };

  const result = evaluateAgainstGold(lowConfidenceOutput, gold);

  const confCheck = result.issues.find((i) => i.metric === 'confidence_threshold');
  assert.ok(confCheck);
  assert.equal(confCheck.passed, false);
});

test('evaluateAgainstGold detects human rights articles when engaged', () => {
  const gold = createGoldDataset()[2]; // constitutional case
  const output = {
    irac: {
      issue: { domain: 'general' },
      conclusion: {
        qualifiers: ['⚠️ Article 5 (life and liberty) engaged'],
      },
    },
    avgConfidence: 0.75,
    validationResult: [],
  };

  const result = evaluateAgainstGold(output, gold);

  const hrcCheck = result.successes.find((s) => s.metric === 'human_rights_detection');
  assert.ok(hrcCheck);
});

test('createAdversarialTests generates 4 challenge scenarios', () => {
  const adversarial = createAdversarialTests();

  assert.equal(adversarial.length, 4);
  assert.ok(adversarial.some((a) => a.id === 'adversarial-001'));
  assert.ok(adversarial.some((a) => a.name === 'Conflicting Authorities'));
  assert.ok(adversarial.some((a) => a.name === 'Insufficient Evidence'));
});

test('runAdversarialTest detects conflicting authorities escalation', () => {
  const testCase = createAdversarialTests()[0];
  const execution = {
    escalations: [{ reason: 'CONFLICTING_AUTHORITIES', severity: 'medium' }],
  };

  const result = runAdversarialTest(testCase, execution);

  assert.equal(result.testId, 'adversarial-001');
  assert.equal(result.passed, true);
});

test('runAdversarialTest catches insufficient evidence', () => {
  const testCase = createAdversarialTests()[2];
  const execution = {
    stages: { retrieval: { cases: [{ citation: 'case1' }] } }, // only 1 case
    escalations: [{ reason: 'LOW_PIPELINE_CONFIDENCE' }],
  };

  const result = runAdversarialTest(testCase, execution);

  assert.equal(result.passed, true);
  assert.ok(result.details.caseCount < testCase.minCasesExpected);
});

test('buildMetricsSnapshot aggregates execution traces', () => {
  const traces = [
    { status: 'SUCCESS', avgConfidence: 0.8 },
    { status: 'SUCCESS', avgConfidence: 0.75 },
    { status: 'ESCALATED', avgConfidence: 0.65 },
  ];
  const evaluations = [];

  const metrics = buildMetricsSnapshot(traces, evaluations);

  assert.equal(metrics.executions.total, 3);
  assert.equal(metrics.executions.successful, 2);
  assert.equal(metrics.executions.escalated, 1);
  assert.ok(metrics.confidence.average > 0.7);
});

test('buildMetricsSnapshot calculates success rate', () => {
  const traces = [
    { status: 'SUCCESS', avgConfidence: 0.8 },
    { status: 'SUCCESS', avgConfidence: 0.8 },
    { status: 'FAILED', avgConfidence: 0.4 },
  ];

  const metrics = buildMetricsSnapshot(traces, []);

  assert.equal(metrics.executions.successRate, 66.67);
});

test('buildMetricsSnapshot includes evaluation metrics', () => {
  const traces = [];
  const evaluations = [
    { totalChecks: 10, passedChecks: 8 },
    { totalChecks: 10, passedChecks: 9 },
  ];

  const metrics = buildMetricsSnapshot(traces, evaluations);

  assert.equal(metrics.evaluation.totalChecks, 20);
  assert.equal(metrics.evaluation.passedChecks, 17);
  assert.equal(metrics.evaluation.successRate, 85);
});
