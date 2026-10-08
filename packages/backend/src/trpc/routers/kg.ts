/**
 * LAWMATE knowledge graph + memory + vector router.
 *
 * This router is the proof that @lawmate/* packages are wired into the
 * backend. Every operation goes through the shared container, so state is
 * shared across all requests.
 */
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { getContainer } from '../../container.js';

export const kgRouter = router({
  // ── Knowledge graph ────────────────────────────────────────────────
  graphStats: protectedProcedure.query(() => {
    return getContainer().kg.stats();
  }),

  addNode: protectedProcedure
    .input(z.object({
      id: z.string(),
      type: z.string(),
      label: z.string(),
      data: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(({ input }) => {
      const node = getContainer().kg.addNode({
        id: input.id,
        type: input.type,
        label: input.label,
        data: input.data ?? {},
      });
      getContainer().audit.record({
        category: 'knowledge-mutation',
        correlationId: `kg-add-${node.id}`,
        actor: { id: 'system', type: 'system', name: 'kg' },
        action: 'kg.addNode',
        resource: node.id,
        decision: 'ALLOW',
        details: { type: node.type },
      });
      return node;
    }),

  neighbors: protectedProcedure
    .input(z.object({ id: z.string(), relation: z.string().optional() }))
    .query(({ input }) => {
      return getContainer().kg.neighbors(input.id, input.relation);
    }),

  traverse: protectedProcedure
    .input(z.object({ startId: z.string(), maxDepth: z.number().int().min(1).max(10).default(3) }))
    .query(({ input }) => {
      return getContainer().kg.traverse(input.startId, input.maxDepth);
    }),

  // ── Memory ─────────────────────────────────────────────────────────
  remember: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      type: z.enum(['working', 'episodic', 'semantic', 'procedural', 'user-project', 'session']),
      key: z.string().max(256),
      content: z.string(),
      confidence: z.number().min(0).max(1).optional(),
      tenantId: z.string().optional(),
      projectId: z.string().optional(),
    }))
    .mutation(({ input }) => {
      return getContainer().memory.remember({
        agentId: input.agentId,
        type: input.type,
        key: input.key,
        content: input.content,
        confidence: input.confidence,
        tenantId: input.tenantId,
        projectId: input.projectId,
        metadata: {},
      });
    }),

  recall: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      query: z.string().optional(),
      type: z.enum(['working', 'episodic', 'semantic', 'procedural', 'user-project', 'session']).optional(),
      limit: z.number().int().min(1).max(100).default(10),
    }))
    .query(({ input }) => {
      return getContainer().memory.recall({
        agentId: input.agentId,
        query: input.query,
        type: input.type,
        limit: input.limit,
      });
    }),

  // ── Vector search ──────────────────────────────────────────────────
  vectorUpsert: protectedProcedure
    .input(z.object({
      collection: z.string(),
      id: z.string(),
      vector: z.array(z.number()),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(({ input }) => {
      return getContainer().vector.upsert(input.collection, input.id, input.vector, input.metadata ?? {});
    }),

  vectorSearch: protectedProcedure
    .input(z.object({
      collection: z.string(),
      vector: z.array(z.number()),
      topK: z.number().int().min(1).max(100).default(10),
    }))
    .query(({ input }) => {
      return getContainer().vector.search(input.collection, input.vector, input.topK);
    }),

  // ── Evidence chain ─────────────────────────────────────────────────
  appendEvidence: protectedProcedure
    .input(z.object({ type: z.string(), payload: z.unknown() }))
    .mutation(({ input }) => {
      return getContainer().evidence.append(input.type, input.payload);
    }),

  verifyEvidence: protectedProcedure.query(() => {
    return getContainer().evidence.verify();
  }),

  // ── Audit ──────────────────────────────────────────────────────────
  auditList: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(50) }).optional())
    .query(({ input }) => {
      return getContainer().audit.getRecent(input?.limit ?? 50);
    }),
});

export type KgRouter = typeof kgRouter;
