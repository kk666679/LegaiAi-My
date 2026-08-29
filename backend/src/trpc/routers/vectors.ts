import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { prisma } from '../../db'
import type { AnyRouter } from '@trpc/server'
export const vectorsRouter: AnyRouter = router({
  upsert: publicProcedure
    .input(z.object({
      collection: z.string(),
      docs: z.array(z.object({
        id: z.string(),
        content: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        vector: z.number().array(),
      })),
    }))
    .mutation(async ({ input }) => {
      for (const doc of input.docs) {
        const meta = doc.metadata ?? null
        await prisma.vectorDoc.upsert({
          where: { id: doc.id },
          update: { collection: input.collection, content: doc.content, metadata: meta as any },
          create: { id: doc.id, collection: input.collection, content: doc.content, metadata: meta as any },
        })
      }
      return { success: true, count: input.docs.length }
    }),

  query: publicProcedure
    .input(z.object({
      collection: z.string(),
      queryEmbedding: z.number().array(),
      topK: z.number().default(5),
      threshold: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const vecStr = `[${input.queryEmbedding.join(',')}]`
      const results = await prisma.$queryRawUnsafe(
        `SELECT id, collection, content, metadata,
                1 - (vector <=> $1::vector) as similarity
         FROM vector_docs
         WHERE collection = $2
         ORDER BY vector <=> $1::vector
         LIMIT $3`,
        vecStr, input.collection, input.topK
      )
      return results
    }),

  listCollections: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const collections = await prisma.vectorDoc.groupBy({
        by: ['collection'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: input.limit,
      })
      return collections
    }),
})
