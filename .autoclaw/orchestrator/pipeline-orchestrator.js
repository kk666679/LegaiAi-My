export function buildOrchestrationPipeline() {
  return {
    stages: [
      {
        name: 'retrieval',
        type: 'required',
        description: 'Search and gather relevant authorities',
      },
      {
        name: 'analysis',
        type: 'required',
        description: 'Apply IRAC analysis to the retrieved material',
      },
      {
        name: 'validation',
        type: 'required',
        description: 'Check the reasoning and citations against evidence',
      },
      {
        name: 'drafting',
        type: 'optional',
        description: 'Draft the final legal output if a document type is requested',
      },
      {
        name: 'hitl-review',
        type: 'conditional',
        description: 'Escalate to human review when risk or impact is high',
      },
    ],
  };
}

export function createPipelineContext(query = '', options = {}) {
  const proBono = Boolean(options.proBono);
  return {
    traceId: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    query: String(query || ''),
    userId: options.userId || 'anonymous',
    proBono,
    priority: proBono ? 1 : 2,
    docType: options.docType || null,
    confidence: {},
    escalations: [],
    errors: [],
    stages: {},
    startTime: Date.now(),
  };
}

export function checkConfidenceThreshold(ctx, stageName, observed, minimum) {
  const normalizedObserved = Number(observed || 0);
  const normalizedMinimum = Number(minimum || 0);

  ctx.confidence[stageName] = normalizedObserved;
  if (normalizedObserved < normalizedMinimum) {
    ctx.errors.push({
      code: 'LOW_CONFIDENCE',
      stage: stageName,
      observed: normalizedObserved,
      minimum: normalizedMinimum,
    });
    return false;
  }

  return true;
}

export function checkEscalationRules(ctx, stage, result = {}) {
  if (stage?.name === 'hitl-review' && (ctx.docType === 'STATEMENT_OF_CLAIM' || ctx.docType === 'WRIT_OF_SUMMONS')) {
    ctx.escalations.push({
      reason: 'HIGH_IMPACT_DOCUMENT',
      severity: 'high',
      message: 'High-impact document type triggers human review.',
    });
  }

  if (result?.conflictingAuthorities > 0 || result?.conflictingAuthorities === 2) {
    ctx.escalations.push({
      reason: 'CONFLICTING_AUTHORITIES',
      severity: 'medium',
      message: 'Conflicting authorities detected during validation.',
    });
  }

  if (Array.isArray(result?.humanRightsEngaged) && result.humanRightsEngaged.length > 0) {
    const count = result.humanRightsEngaged.length;
    ctx.escalations.push({
      reason: 'HUMAN_RIGHTS_ENGAGED',
      severity: 'high',
      message: `${count} human rights provisions were engaged.`,
    });
  }

  return ctx;
}

export function buildStageExecutionPlan(pipeline, ctx) {
  const requiredStages = (pipeline?.stages || []).filter((stage) => stage.name !== 'drafting' && stage.name !== 'hitl-review');
  const plan = requiredStages.map((stage) => ({ ...stage, stage: stage.name }));

  const hasDocDrafting = Boolean(ctx.docType);
  if (hasDocDrafting) {
    const draftingStage = (pipeline?.stages || []).find((stage) => stage.name === 'drafting');
    if (draftingStage) {
      plan.push({ ...draftingStage, stage: draftingStage.name });
    }
  }

  const needsHitl = ctx.docType === 'STATEMENT_OF_CLAIM' || ctx.docType === 'WRIT_OF_SUMMONS' || ctx.escalations.length > 0;
  if (needsHitl) {
    const hitlStage = (pipeline?.stages || []).find((stage) => stage.name === 'hitl-review');
    if (hitlStage) {
      plan.push({ ...hitlStage, stage: hitlStage.name });
    }
  }

  return plan;
}

export function summarizeExecutionTrace(ctx) {
  const completedStages = Object.values(ctx.stages || {}).filter(Boolean).length;
  const avgConfidence = Object.keys(ctx.confidence || {}).length > 0
    ? Object.values(ctx.confidence).reduce((sum, value) => sum + Number(value || 0), 0) / Object.keys(ctx.confidence).length
    : 0;

  const status = ctx.errors.length > 0 ? 'FAILED' : ctx.escalations.length > 0 ? 'ESCALATED' : 'SUCCESS';

  return {
    traceId: ctx.traceId,
    stagesCompleted: completedStages,
    escalationCount: ctx.escalations.length,
    totalDuration: Math.max(0, Date.now() - (ctx.startTime || Date.now())),
    avgConfidence,
    hasErrors: ctx.errors.length > 0,
    status,
  };
}
