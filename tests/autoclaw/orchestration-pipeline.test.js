import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOrchestrationPipeline,
  createPipelineContext,
  checkConfidenceThreshold,
  checkEscalationRules,
  buildStageExecutionPlan,
  summarizeExecutionTrace,
} from '../../.autoclaw/orchestrator/pipeline-orchestrator.js';

test('buildOrchestrationPipeline defines all 5 stages with proper metadata', () => {
  const pipeline = buildOrchestrationPipeline();

  assert.equal(pipeline.stages.length, 5);
  assert.equal(pipeline.stages[0].name, 'retrieval');
  assert.equal(pipeline.stages[1].name, 'analysis');
  assert.equal(pipeline.stages[2].name, 'validation');
  assert.equal(pipeline.stages[3].name, 'drafting');
  assert.equal(pipeline.stages[4].name, 'hitl-review');
});

test('createPipelineContext initializes execution context with trace ID', () => {
  const ctx = createPipelineContext('test query', { userId: 'user-123', proBono: true });

  assert.ok(ctx.traceId);
  assert.equal(ctx.query, 'test query');
  assert.equal(ctx.userId, 'user-123');
  assert.equal(ctx.proBono, true);
  assert.equal(ctx.priority, 1); // pro bono gets priority
});

test('checkConfidenceThreshold validates stage confidence against minimum', () => {
  const ctx = createPipelineContext('test query');

  const passed1 = checkConfidenceThreshold(ctx, 'retrieval', 0.8, 0.6);
  assert.equal(passed1, true);
  assert.equal(ctx.confidence.retrieval, 0.8);

  const passed2 = checkConfidenceThreshold(ctx, 'analysis', 0.5, 0.6);
  assert.equal(passed2, false);
  assert.equal(ctx.errors.length, 1);
  assert.equal(ctx.errors[0].code, 'LOW_CONFIDENCE');
});

test('checkEscalationRules flags high-impact document types', () => {
  const ctx = createPipelineContext('test query', { docType: 'STATEMENT_OF_CLAIM' });
  const stage = buildOrchestrationPipeline().stages[4]; // hitl-review

  checkEscalationRules(ctx, stage, {});

  const escalations = ctx.escalations.filter((e) => e.reason === 'HIGH_IMPACT_DOCUMENT');
  assert.equal(escalations.length, 1);
});

test('checkEscalationRules detects conflicting authorities', () => {
  const ctx = createPipelineContext('test query');
  ctx.escalations = []; // reset
  const stage = buildOrchestrationPipeline().stages[4];

  checkEscalationRules(ctx, stage, {
    conflictingAuthorities: 2,
  });

  const escalations = ctx.escalations.filter((e) => e.reason === 'CONFLICTING_AUTHORITIES');
  assert.equal(escalations.length, 1);
});

test('checkEscalationRules flags human rights engagement', () => {
  const ctx = createPipelineContext('test query');
  const stage = buildOrchestrationPipeline().stages[4];

  checkEscalationRules(ctx, stage, {
    humanRightsEngaged: ['Article 5', 'Article 8'],
  });

  const escalations = ctx.escalations.filter((e) => e.reason === 'HUMAN_RIGHTS_ENGAGED');
  assert.equal(escalations.length, 1);
  assert.ok(escalations[0].message.includes('2'));
});

test('buildStageExecutionPlan skips optional stages without inputs', () => {
  const pipeline = buildOrchestrationPipeline();
  const ctx = createPipelineContext('test query'); // no docType

  const plan = buildStageExecutionPlan(pipeline, ctx);

  const draftingStage = plan.find((p) => p.stage === 'drafting');
  assert.equal(draftingStage, undefined); // should skip drafting (optional)

  const retrievalStage = plan.find((p) => p.stage === 'retrieval');
  assert.ok(retrievalStage); // should include retrieval
});

test('buildStageExecutionPlan includes HITL only when escalations exist or high-impact', () => {
  const pipeline = buildOrchestrationPipeline();
  const ctx = createPipelineContext('test query', { docType: 'STATEMENT_OF_CLAIM' });

  const plan = buildStageExecutionPlan(pipeline, ctx);

  const hitlStage = plan.find((p) => p.stage === 'hitl-review');
  assert.ok(hitlStage); // should include HITL for high-impact docType
});

test('summarizeExecutionTrace calculates metrics and determines status', () => {
  const ctx = createPipelineContext('test query');
  ctx.startTime = Date.now() - 5000;
  ctx.stages = { retrieval: true, analysis: true, validation: true };
  ctx.confidence = { retrieval: 0.9, analysis: 0.8, validation: 0.7 };
  ctx.escalations = [{ severity: 'high', reason: 'HIGH_IMPACT_DOCUMENT' }];

  const summary = summarizeExecutionTrace(ctx);

  assert.equal(summary.stagesCompleted, 3);
  assert.equal(summary.escalationCount, 1);
  assert.ok(summary.totalDuration >= 5000);
  assert.ok(
    summary.avgConfidence > 0.7 && summary.avgConfidence < 0.95
  );
  assert.equal(summary.status, 'ESCALATED');
});

test('summarizeExecutionTrace marks FAILED status when errors present', () => {
  const ctx = createPipelineContext('test query');
  ctx.errors = [{ code: 'LOW_CONFIDENCE', stage: 'analysis' }];

  const summary = summarizeExecutionTrace(ctx);

  assert.equal(summary.status, 'FAILED');
  assert.equal(summary.hasErrors, true);
});
