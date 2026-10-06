class PromptRegistry {
  constructor() { this.prompts = new Map(); }

  register(prompt) {
    if (!prompt || !prompt.name || typeof prompt.render !== 'function') throw new Error('Prompt must be { name, render }');
    this.prompts.set(prompt.name, prompt);
    return this;
  }
  /** Synchronous lookup. Distinct from `get()` so the async renderer cannot shadow it. */
  peek(name) { return this.prompts.get(name) || null; }
  has(name) { return this.prompts.has(name); }
  size() { return this.prompts.size; }
  list() { return [...this.prompts.values()].map(p => ({ name: p.name, description: p.description || '', arguments: p.arguments || [] })); }
  /** Render a prompt with args. Returns null for an unknown name. */
  async get(name, args = {}) {
    const p = this.peek(name);
    return p ? p.render(args || {}) : null;
  }
}

function buildDefaultPrompts(_deps = {}) {
  const pr = new PromptRegistry();

  pr.register({
    name: 'irac_analysis',
    description: 'Draft an IRAC analysis for a legal query.',
    arguments: [{ name: 'query', required: true }, { name: 'jurisdiction' }],
    render: ({ query, jurisdiction = 'Malaysia' }) => ({
      description: `IRAC analysis for: ${query}`,
      messages: [{
        role: 'user',
        content: { type: 'text', text: [
          `You are a legal analyst for ${jurisdiction}.`,
          `Analyse the following query using the IRAC method.`,
          `Query: ${query}`,
          '',
          'Structure: Issue, Rule, Application, Conclusion.',
          'Cite inline as [1], [2], … and provide a citation list.'
        ].join('\n') }
      }]
    })
  });

  pr.register({
    name: 'legal_memo',
    description: 'Draft a legal memorandum.',
    arguments: [
      { name: 'subject', required: true }, { name: 'to' }, { name: 'from' }, { name: 'facts', required: true }
    ],
    render: ({ subject, to = 'Client', from = 'Autoclaw', facts }) => ({
      description: `Legal memo: ${subject}`,
      messages: [{
        role: 'user',
        content: { type: 'text', text: [
          'Draft a legal memorandum.',
          `To: ${to}`, `From: ${from}`, `Re: ${subject}`,
          '', 'Facts:', facts, '',
          'Sections: I. Question Presented, II. Short Answer, III. Applicable Rules, IV. Analysis, V. Conclusion.'
        ].join('\n') }
      }]
    })
  });

  pr.register({
    name: 'citation_check',
    description: 'Verify citations against a known rule set.',
    arguments: [{ name: 'proposal', required: true }, { name: 'rules' }],
    render: ({ proposal, rules = '' }) => ({
      description: 'Citation verification',
      messages: [{
        role: 'user',
        content: { type: 'text', text: [
          'Verify every citation in the proposal resolves to a known rule.',
          'List unresolved or fabricated citations.',
          '', 'Proposal:', proposal, '', 'Known rules:',
          typeof rules === 'string' ? rules : JSON.stringify(rules, null, 2)
        ].join('\n') }
      }]
    })
  });

  pr.register({
    name: 'bilingual_summary',
    description: 'Summarise text in EN and MS.',
    arguments: [{ name: 'text', required: true }, { name: 'maxWords' }],
    render: ({ text, maxWords = 120 }) => ({
      description: 'Bilingual summary',
      messages: [{
        role: 'user',
        content: { type: 'text', text: [
          `Summarise in ≤${maxWords} words.`,
          'Produce the summary twice: first EN, then MS.',
          'Label the sections "EN:" and "MS:".', '', text
        ].join('\n') }
      }]
    })
  });

  pr.register({
    name: 'agent_plan',
    description: 'Ask an architect agent to plan a workflow.',
    arguments: [{ name: 'objective', required: true }, { name: 'constraints' }],
    render: ({ objective, constraints = [] }) => ({
      description: `Plan: ${objective}`,
      messages: [{
        role: 'user',
        content: { type: 'text', text: [
          'You are the architect agent.',
          `Objective: ${objective}`,
          constraints.length ? `Constraints:\n- ${constraints.join('\n- ')}` : '',
          '',
          'Return an ordered plan of steps, each with { skill, inputs }.',
          'Name the two most likely failure modes and a mitigation each.'
        ].filter(Boolean).join('\n') }
      }]
    })
  });

  return pr;
}

;

export { PromptRegistry, buildDefaultPrompts };
