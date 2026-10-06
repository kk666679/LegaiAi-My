import { createRequire } from 'node:module';
import { toolResult, toolError } from '../protocol.js';

const require = createRequire(import.meta.url);

function build() {
  return [
    {
      name: 'i18n_detect',
      description: 'Detect whether text is EN or MS.',
      inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'], additionalProperties: false },
      handler: async ({ text = '' } = {}) => {
        try { const { detect } = require('../../i18n'); return toolResult([{ type: 'text', text: JSON.stringify({ lang: detect(text) }) }]); }
        catch (e) { return toolError(e.message); }
      }
    },
    {
      name: 'i18n_translate',
      description: 'Translate a known catalog key between EN and MS.',
      inputSchema: {
        type: 'object',
        properties: { key: { type: 'string' }, lang: { type: 'string', enum: ['en', 'ms'] } },
        required: ['key', 'lang'], additionalProperties: false
      },
      handler: async ({ key, lang = 'en' } = {}) => {
        try { const { Translator } = require('../../i18n'); const t = new Translator(); return toolResult([{ type: 'text', text: t.t(key, lang) }]); }
        catch (e) { return toolError(e.message); }
      }
    }
  ];
}
;

export { build };
