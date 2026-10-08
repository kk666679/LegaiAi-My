export class DiagnosticsError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'DiagnosticsError';
    this.code = code;
  }
}

export class ClassificationError extends DiagnosticsError {
  constructor(message) {
    super(message, 'CLASSIFICATION_ERROR');
    this.name = 'ClassificationError';
  }
}

export class RCAError extends DiagnosticsError {
  constructor(message) {
    super(message, 'RCA_ERROR');
    this.name = 'RCAError';
  }
}

export class RemediationError extends DiagnosticsError {
  constructor(message) {
    super(message, 'REMEDIATION_ERROR');
    this.name = 'RemediationError';
  }
}
