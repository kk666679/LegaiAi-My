import type { LearningExample } from './example.js';
import type { LearningProposal } from './proposal.js';

export class LearningPipeline {
  private exampleMap = new Map<string, LearningExample>();
  private proposalMap = new Map<string, LearningProposal>();

  collect(
    input: Omit<LearningExample, 'id' | 'collectedAt' | 'metadata'>
      & { metadata?: Record<string, unknown> }
  ): LearningExample {
    const ex: LearningExample = {
      id: `lex_${Math.random().toString(36).slice(2, 10)}`,
      source: input.source,
      input: input.input,
      expectedOutput: input.expectedOutput,
      outcome: input.outcome,
      feedback: input.feedback,
      collectedAt: new Date().toISOString(),
      metadata: input.metadata ?? {},
    };
    this.exampleMap.set(ex.id, ex);
    return ex;
  }

  propose(input: Omit<LearningProposal, 'id' | 'createdAt' | 'status'>): LearningProposal {
    const p: LearningProposal = {
      id: `lpr_${Math.random().toString(36).slice(2, 10)}`,
      targetId: input.targetId,
      targetType: input.targetType,
      description: input.description,
      expectedImpact: input.expectedImpact,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    this.proposalMap.set(p.id, p);
    return p;
  }

  advance(id: string, status: LearningProposal['status']): LearningProposal | undefined {
    const p = this.proposalMap.get(id);
    if (!p) return undefined;
    p.status = status;
    return p;
  }

  examples(): LearningExample[] { return Array.from(this.exampleMap.values()); }
  proposals(): LearningProposal[] { return Array.from(this.proposalMap.values()); }
}
