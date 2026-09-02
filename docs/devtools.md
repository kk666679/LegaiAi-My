---
title: Devtools
id: devtools
order: 3
---

# LAW MATE — Devtools

The repo uses [TanStack Devtools](https://tanstack.com/devtools) for in-browser inspection of AI traffic during development. The devtools panel is **not** shipped in production builds.

For the upstream install/usage boilerplate see the [TanStack AI Devtools docs](https://tanstack.com/ai/latest/docs/devtools). This page covers the LAW MATE-specific wiring only.

---

## Install (once)

```bash
npm install -D @tanstack/react-ai-devtools @tanstack/react-devtools
```

---

## Mount in the root layout

The devtools panel must be mounted in `app/layout.tsx` (or equivalent) and gated on `NODE_ENV`:

```tsx
import { TanStackDevtools } from "@tanstack/react-devtools"
import { aiDevtoolsPlugin } from "@tanstack/react-ai-devtools"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === "development" && (
          <TanStackDevtools
            plugins={[aiDevtoolsPlugin()]}
            eventBusConfig={{ connectToServerBus: true }}
          />
        )}
      </body>
    </html>
  )
}
```

> `connectToServerBus: true` forwards `/api/events/stream` (SSE) events from the backend into the panel — required to see worker/job lifecycle and tool-call traces originating on the server side. Without it, only client-originated chat events appear.

---

## What you can inspect

- Live chat messages and tool calls (per [ai-chat.md](ai-chat.md))
- Tool input/output for each `legal_*` tool (see [tools.md](tools.md))
- Queue/job lifecycle from the backend SSE stream
- Citation validation results (per [agent-api.md](agent-api.md#agentsvalidate))

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Panel shows "no events" | `eventBusConfig` missing | Add `connectToServerBus: true` |
| Panel not visible in production | NODE_ENV guard | Confirm build used `next build` without `NODE_ENV=development` |
| Tool calls absent | Tool not registered | Confirm tool exists in `backend/src/tools/index.ts` and [tools.md](tools.md) catalogue |