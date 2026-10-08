import Ajv from 'ajv';

/**
 * eval/scorers/json-schema.js — JSON schema validation scorer.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const ajv = new Ajv();

const jsonSchemaScorer = {
  name: 'json-schema',
  async score({ output, testCase }) {
    if (!testCase.schema) return { scorer: 'json-schema', value: 1, detail: 'No schema' };
    const validate = ajv.compile(testCase.schema);
    const valid = validate(output);
    return {
      scorer: 'json-schema',
      value: valid ? 1 : 0,
      detail: valid ? 'Valid' : JSON.stringify(validate.errors),
    };
  }
};

export { jsonSchemaScorer as jsonSchemaScorer };
