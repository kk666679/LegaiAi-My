/**
 * @lawmate/safety — Input/output validation and risk classification.
 */
import {
  RiskLevel,
  DataClass,
  LawmateError,
  ErrorCode,
  Metadata,
} from '@lawmate/types';

export interface InputValidator {
  validate(input: unknown, schema?: Record<string, unknown>): { valid: boolean; errors?: string[] };
  classifyRisk(input: unknown): RiskLevel;
  detectSensitive(input: unknown): { pii: boolean; secrets: boolean; classified: boolean };
}

export class DefaultInputValidator implements InputValidator {
  validate(input: unknown, _schema?: Record<string, unknown>): { valid: boolean; errors?: string[] } {
    if (input === undefined || input === null) {
      return { valid: false, errors: ['Input is null or undefined'] };
    }
    return { valid: true };
  }

  classifyRisk(input: unknown): RiskLevel {
    const str = JSON.stringify(input).toLowerCase();
    if (/(password|secret|api[_-]?key|token|private[_-]?key)/.test(str)) return 'critical';
    if (/(ssn|social[_-]?security|credit[_-]?card|bank[_-]?account)/.test(str)) return 'high';
    if (/(email|phone|address|passport|license)/.test(str)) return 'medium';
    return 'low';
  }

  detectSensitive(input: unknown): { pii: boolean; secrets: boolean; classified: boolean } {
    const str = JSON.stringify(input).toLowerCase();
    const pii = /(email|phone|address|ssn|passport|license|ic number|identity)/.test(str);
    const secrets = /(password|secret|api[_-]?key|token|private[_-]?key|credential)/.test(str);
    const classified = /(classified|confidential|privileged|top[_-]?secret)/.test(str);
    return { pii, secrets, classified };
  }
}

export function createInputValidator(): InputValidator {
  return new DefaultInputValidator();
}

export function assertDataClassAllowed(
  dataClass: DataClass,
  allowed: DataClass[],
  requestId?: string
): void {
  if (!allowed.includes(dataClass)) {
    const err: LawmateError = {
      code: 'POLICY_DENIED',
      message: `Data class ${dataClass} is not permitted`,
      requestId,
      timestamp: new Date().toISOString(),
    };
    throw err;
  }
}

export function redactSensitiveFields(
  data: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };
  for (const field of fields) {
    if (field in result) {
      result[field] = '[REDACTED]';
    }
  }
  return result;
}