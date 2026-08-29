---
title: AI Chat Integration
id: ai-chat
order: 1
---

# LAW MATE — AI Chat Integration

The frontend chat interface at `/legalai` connects to the backend via two paths:

1. **Streaming SSE** — `POST /api/ai-chat` for real-time token streaming
2. **tRPC** — `agents.*` procedures for structured agent calls

---

## Streaming chat (`/api/ai-chat`)

The backend uses `@tanstack/ai` with an Ollama adapter for streaming responses.

```typescript
// app/api/chat/route.ts
import { chat, toServerSentEventsResponse } from "@tanstack/ai"
import { ollamaText } from "@tanstack/ai-ollama"

export async function POST(request: Request) {
  const { messages } = await request.json()

  const stream = chat({
    adapter: ollamaText(process.env.LLM_MODEL ?? "minimax-m2.7:cloud", {
      baseUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
    }),
    messages,
    systemPrompts: ["You are LAW MATE, a Malaysian legal AI assistant."],
  })

  return toServerSentEventsResponse(stream)
}
```

---

## Frontend hook

```typescript
// hooks/useChat.ts
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react"

const { messages, sendMessage, status } = useChat({
  connection: fetchServerSentEvents("/api/chat"),
})
```

---

## tRPC client

```typescript
// components/trpc-client.tsx
import { createTRPCReact } from "@trpc/react-query"
import type { AppRouter } from "@/types/trpc"

export const trpc = createTRPCReact<AppRouter>()
```

Usage in a component:

```typescript
const { data, isLoading } = trpc.agents.retrieve.useQuery({
  query: "wrongful dismissal constructive dismissal",
  court: "HC",
  topK: 5,
})
```

---

## Tool definitions (Ollama)

Legal tools are defined using `toolDefinition()` and passed to the Ollama chat adapter:

```typescript
import { toolDefinition } from "@tanstack/ai"
import { z } from "zod"

const legalRetrieveTool = toolDefinition({
  name: "legal_retrieve",
  description: "Search Malaysian case law by legal issue",
  inputSchema: z.object({
    query: z.string().min(10),
    court: z.enum(["FC", "CA", "HC", "SC", "MC"]).optional(),
    topK: z.number().default(5),
  }),
  outputSchema: z.object({
    cases: z.array(z.object({
      citation: z.string(),
      caseName: z.string(),
      relevanceScore: z.number(),
      status: z.string(),
    })),
  }),
}).server(async ({ query, court, topK }) => {
  // Delegates to BullMQ legal-retrieval worker via tRPC
  const result = await trpcServer.agents.retrieve({ query, court, topK })
  return result
})
```

---

## Devtools

To inspect AI interactions during development, add the TanStack AI devtools panel:

```bash
npm install -D @tanstack/react-ai-devtools @tanstack/react-devtools
```

```tsx
import { TanStackDevtools } from "@tanstack/react-devtools"
import { aiDevtoolsPlugin } from "@tanstack/react-ai-devtools"

// In your root layout (dev only)
{process.env.NODE_ENV === "development" && (
  <TanStackDevtools
    plugins={[aiDevtoolsPlugin()]}
    eventBusConfig={{ connectToServerBus: true }}
  />
)}
```

The devtools panel shows live tool calls, message history, and streaming state — useful for debugging agent routing and citation validation flows.
