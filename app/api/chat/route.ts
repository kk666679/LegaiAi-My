import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/security'
import { z } from 'zod'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().trim().min(1).max(12000),
}).strict()
const requestSchema = z.object({ messages: z.array(messageSchema).min(1).max(40) }).strict()

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 20)
  if (limited) return limited
  try {
    const parsed = requestSchema.safeParse(await req.json())
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid chat request' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    const { messages } = parsed.data

    const result = chat({
      adapter: openaiText('gpt-4o-mini'), 
      messages: [
        {
          role: 'system',
          content: `You are LAW MATE — Malaysian legal AI assistant. 

Legal guidelines:
• Cite Malaysian cases as [YYYY] N MLJ NNN format  
• Reference Federal Constitution Articles directly
• Quote relevant statutes with section numbers
• Include CONFIDENCE: X.XX score (0.0-1.0) at end
• Maintain formal, accurate legal tone
• Flag limitations: "This is not legal advice"
• Prioritize PDPA compliance

Respond concisely with provenance.`,
        } as any,
        ...messages.map((message) => ({ role: message.role, content: message.content }) as any)
      ],
      stream: true
    })

    return toServerSentEventsResponse(result)
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
