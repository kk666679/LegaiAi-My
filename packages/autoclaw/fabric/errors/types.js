export class FabricError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FabricError';
    this.code = code;
  }
}

export class RegistrationError extends FabricError {
  constructor(message) {
    super(message, 'REGISTRATION_ERROR');
    this.name = 'RegistrationError';
  }
}

export class DispatchError extends FabricError {
  constructor(message) {
    super(message, 'DISPATCH_ERROR');
    this.name = 'DispatchError';
  }
}

export class PolicyError extends FabricError {
  constructor(message) {
    super(message, 'POLICY_ERROR');
    this.name = 'PolicyError';
  }
}
