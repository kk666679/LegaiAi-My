import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import type { AnyRouter } from '@trpc/server';

export const debateRouter: AnyRouter = router({
  start: publicProcedure
    .input(z.object({ 
      problem: z.string().min(10),
      citations: z.array(z.string()),
      rounds: z.number().min(1).max(10)
    }))
    .mutation(async ({ input }) => {
      // Placeholder for enqueueDebateJob
      const jobId = `debate_${Date.now()}`;
      console.log('Enqueued debate job:', jobId, input);
      return { jobId };
    }),

  getById: publicProcedure
    .input(z.string())
    .query(async ({ input: id }) => {
      // Placeholder: getDebateFromStore(id)
      return {
        id,
        status: 'demo-complete' as const,
        rounds: [],
        scores: { applicant: 8.2, respondent: 7.9 },
        winner: 'applicant'
      };
    }),

  list: publicProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input }) => {
      // Placeholder: getRecentDebates
      return [
        { id: 'demo1', problem: 'Sample debate', createdAt: new Date().toISOString() }
      ];
    }),
});

