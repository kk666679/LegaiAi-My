import { z } from 'zod';
import { router, protectedProcedure, permissionProcedure } from '../trpc';
import { prisma } from '../../db';
import { queues } from '../../queues/index';
import { TRPCError } from '@trpc/server';
import { randomUUID } from 'crypto';
import type { AnyRouter } from '@trpc/server';

type DebateJobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused' | 'stuck' | 'prioritized' | 'unknown';

function toTranscript(arg: unknown, idx: number) {
  const r = (arg ?? {}) as Record<string, unknown>;
  return {
    round: typeof r.round === 'number' ? r.round : idx + 1,
    role: typeof r.role === 'string' ? r.role : 'unknown',
    agent: typeof r.role === 'string' ? r.role : 'unknown',
    argument: typeof r.argument === 'string' ? r.argument : '',
    score: typeof r.score === 'number' ? r.score : null,
    timestamp: typeof r.timestamp === 'string' ? r.timestamp : new Date().toISOString(),
  };
}

export const debateRouter: AnyRouter = router({
  start: permissionProcedure('run_agents')
    .input(z.object({
      problem: z.string().min(10),
      citations: z.array(z.string()),
      rounds: z.number().min(1).max(10)
    }))
    .mutation(async ({ input, ctx }) => {
      // Enqueue a real debate job on the legal-debate BullMQ queue —
      // the same queue the agents.debate procedure uses and that
      // agents.debateStatus polls. No fake job IDs.
      const traceId = ctx.traceId ?? randomUUID();
      const job = await queues.debate.add('debate', {
        problem: input.problem,
        citations: input.citations,
        rounds: input.rounds,
        traceId,
        userId: ctx.user.id,
      });
      return { jobId: job.id as string, traceId };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input: id, ctx }) => {
      // 1) Live queue job (debate started from the UI returns a BullMQ job id)
      const job = await queues.debate.getJob(id).catch(() => null);
      if (job) {
        if (job.data?.userId && job.data.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate job not found' });
        }
        const state = (await job.getState().catch(() => 'unknown')) as DebateJobState;
        const result = (state === 'completed' ? job.returnvalue : null) as {
          debateId?: string;
          problem?: string;
          transcript?: unknown[];
          scores?: { applicant: number; respondent: number };
          winner?: string;
        } | null;
        const transcript = Array.isArray(result?.transcript) ? result.transcript : [];
        return {
          id,
          status: state,
          problem: result?.problem ?? job.data?.problem ?? '',
          rounds: transcript.map(toTranscript),
          scores: result?.scores ?? null,
          winner: result?.winner ?? null,
          debateId: result?.debateId ?? null,
        };
      }

      // 2) Persisted transcript (completed debates listed by `list`)
      const transcript = await prisma.debateTranscript.findUnique({ where: { id } });
      if (!transcript) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate not found' });
      }
      const rounds = (Array.isArray(transcript.rounds)
        ? (transcript.rounds as unknown[])
        : []);
      return {
        id: transcript.id,
        status: 'completed' as const,
        problem: transcript.problem,
        rounds: rounds.map(toTranscript),
        scores: null,
        winner: transcript.winner,
        debateId: transcript.id,
      };
    }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input }) => {
      // Real persisted transcripts — the debate worker writes one row per
      // completed debate. This is backend state, never demo data.
      const rows = await prisma.debateTranscript.findMany({
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        select: { id: true, problem: true, winner: true, createdAt: true },
      });
      return rows.map((r) => ({
        id: r.id,
        problem: r.problem,
        status: 'completed' as const,
        winner: r.winner,
        createdAt: r.createdAt.toISOString(),
      }));
    }),
});

