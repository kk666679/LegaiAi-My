export function createGoldDataset() {
  return [
    {
      id: 'company-law-001',
      category: 'company-law',
      expectedDomain: 'company',
      expectedIssue: 'director fiduciary duty',
      expectedCitations: 2,
      expectedConfidenceMin: 0.6,
    },
    {
      id: 'employment-001',
      category: 'employment',
      expectedDomain: 'employment',
      expectedIssue: 'unfair dismissal compensation',
      expectedCitations: 2,
      expectedConfidenceMin: 0.55,
    },
    {
      id: 'constitutional-001',
      category: 'constitutional',
      expectedDomain: 'constitutional',
      expectedIssue: 'fundamental liberties and rights',
      expectedCitations: 2,
      expectedConfidenceMin: 0.7,
      humanRightsArticles: ['Article 5', 'Article 8'],
    },
    {
      id: 'contract-law-001',
      category: 'contract-law',
      expectedDomain: 'contract',
      expectedIssue: 'breach of contract and damages',
      expectedCitations: 1,
      expectedConfidenceMin: 0.5,
    },
  ];
}

export function evaluateAgainstGold(output = {}, gold = createGoldDataset()[0]) {
  const successes = [];
  const issues = [];

  const candidateDomain = String(output?.irac?.issue?.domain || '').toLowerCase();
  const expectedDomain = String(gold.expectedDomain || '').toLowerCase();
  const domainPassed = candidateDomain === expectedDomain;

  successes.push({ metric: 'domain_detection', passed: domainPassed, expected: expectedDomain, actual: candidateDomain });
  if (!domainPassed) {
    issues.push({ metric: 'domain_detection', passed: false, expected: expectedDomain, actual: candidateDomain });
  }

  const confidence = Number(output?.avgConfidence ?? 0);
  const confidencePassed = confidence >= Number(gold.expectedConfidenceMin || 0);
  successes.push({ metric: 'confidence_threshold', passed: confidencePassed, expected: gold.expectedConfidenceMin, actual: confidence });
  if (!confidencePassed) {
    issues.push({ metric: 'confidence_threshold', passed: false, expected: gold.expectedConfidenceMin, actual: confidence });
  }

  const humanRightsTriggered = Array.isArray(gold.humanRightsArticles) && gold.humanRightsArticles.length > 0;
  const conclusionText = String(output?.irac?.conclusion?.qualifiers?.join(' ') || '');
  const humanRightsDetected = /article\s*5|article\s*8|fundamental rights/i.test(conclusionText);

  if (humanRightsTriggered) {
    const passed = humanRightsDetected;
    successes.push({ metric: 'human_rights_detection', passed, expected: gold.humanRightsArticles.length, actual: conclusionText });
    if (!passed) {
      issues.push({ metric: 'human_rights_detection', passed: false, expected: gold.humanRightsArticles.length, actual: conclusionText });
    }
  }

  const summary = {
    totalChecks: successes.length,
    passedChecks: successes.filter((item) => item.passed).length,
    failedChecks: successes.filter((item) => !item.passed).length,
    successRate: successes.length > 0 ? Number(((successes.filter((item) => item.passed).length / successes.length) * 100).toFixed(2)) : 0,
  };

  return {
    gold,
    successes,
    issues,
    summary,
  };
}

export function createAdversarialTests() {
  return [
    {
      id: 'adversarial-001',
      name: 'Conflicting Authorities',
      description: 'Conflicting authorities should trigger escalation.',
      minCasesExpected: 2,
      escalationReason: 'CONFLICTING_AUTHORITIES',
    },
    {
      id: 'adversarial-002',
      name: 'Fabricated Citation',
      description: 'A fabricated authority should be caught as invalid.',
      minCasesExpected: 1,
      escalationReason: 'FABRICATED_CITATION',
    },
    {
      id: 'adversarial-003',
      name: 'Insufficient Evidence',
      description: 'Low evidence volume should trigger review.',
      minCasesExpected: 2,
      escalationReason: 'LOW_PIPELINE_CONFIDENCE',
    },
    {
      id: 'adversarial-004',
      name: 'Privacy Leak',
      description: 'Cross-client data leakage should be blocked.',
      minCasesExpected: 1,
      escalationReason: 'PRIVACY_LEAK',
    },
  ];
}

export function runAdversarialTest(testCase, execution = {}) {
  const escalations = Array.isArray(execution?.escalations) ? execution.escalations : [];
  const stageCounts = execution?.stages || {};
  const retrievalCases = Array.isArray(stageCounts?.retrieval?.cases) ? stageCounts.retrieval.cases : [];

  let passed = false;
  let details = {};

  if (testCase.name === 'Conflicting Authorities') {
    passed = escalations.some((item) => item.reason === 'CONFLICTING_AUTHORITIES');
    details = { escalationFound: passed };
  } else if (testCase.name === 'Insufficient Evidence') {
    const caseCount = retrievalCases.length;
    passed = caseCount < testCase.minCasesExpected || escalations.some((item) => item.reason === 'LOW_PIPELINE_CONFIDENCE');
    details = { caseCount, minCasesExpected: testCase.minCasesExpected };
  } else {
    passed = escalations.length > 0;
    details = { escalations };
  }

  return {
    testId: testCase.id,
    passed,
    details,
  };
}

export function buildMetricsSnapshot(traces = [], evaluations = []) {
  const executionSummary = {
    total: traces.length,
    successful: traces.filter((item) => item.status === 'SUCCESS').length,
    failed: traces.filter((item) => item.status === 'FAILED').length,
    escalated: traces.filter((item) => item.status === 'ESCALATED').length,
    successRate: 0,
  };

  if (executionSummary.total > 0) {
    executionSummary.successRate = Number(((executionSummary.successful / executionSummary.total) * 100).toFixed(2));
  }

  const confidenceValues = traces.filter((item) => Number.isFinite(Number(item.avgConfidence))).map((item) => Number(item.avgConfidence));
  const confidenceAverage = confidenceValues.length > 0 ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length : 0;

  const totalChecks = evaluations.reduce((sum, item) => sum + Number(item.totalChecks || 0), 0);
  const passedChecks = evaluations.reduce((sum, item) => sum + Number(item.passedChecks || 0), 0);
  const evaluationSuccessRate = totalChecks > 0 ? Number(((passedChecks / totalChecks) * 100).toFixed(2)) : 0;

  return {
    executions: executionSummary,
    confidence: {
      average: Number(confidenceAverage.toFixed(4)),
    },
    evaluation: {
      totalChecks,
      passedChecks,
      successRate: Number(evaluationSuccessRate.toFixed(2)),
    },
  };
}
