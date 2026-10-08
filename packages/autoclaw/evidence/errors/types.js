export class EvidenceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'EvidenceError';
    this.code = code;
  }
}

export class ChainError extends EvidenceError {
  constructor(message) {
    super(message, 'CHAIN_ERROR');
    this.name = 'ChainError';
  }
}

export class VerificationError extends EvidenceError {
  constructor(message) {
    super(message, 'VERIFICATION_ERROR');
    this.name = 'VerificationError';
  }
}
