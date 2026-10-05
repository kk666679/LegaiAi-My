import { generateText, gateway } from 'ai'
import { NextResponse } from 'next/server'

const model = gateway('google/gemini-3-flash')

export async function POST(request: Request) {
  try {
    const { intent, nodes } = await request.json()
    const { text } = await generateText({
      model,
      system: 'You are Lawmate AI, a concise legal career workflow strategist. Give practical, non-legal-advice recommendations in 2-4 short sentences. Do not invent credentials or guarantee career outcomes.',
      prompt: `Analyze this workflow for ${intent}. Current steps: ${JSON.stringify(nodes)}. Return a concise recommendation with one clear next action.`,
    })
    return NextResponse.json({ text })
  } catch {
    return NextResponse.json({ text: 'AI is temporarily unavailable. Your workflow is still safe to edit locally.' }, { status: 200 })
  }
}
