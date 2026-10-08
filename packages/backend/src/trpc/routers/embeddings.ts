import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import ollama from 'ollama'
import type { AnyRouter } from '@trpc/server'

export const embeddingsRouter: AnyRouter = router({
  embed: publicProcedure
    .input(z.object({
      text: z.string(),
      model: z.string().default('mxbai-embed-large')
    }))
    .query(async ({ input }) => {
      const response = await ollama.embeddings({
        model: input.model,
        prompt: input.text,
      })
      return {
        embedding: response.embedding,
        dim: response.embedding.length,
      }
    }),
})
