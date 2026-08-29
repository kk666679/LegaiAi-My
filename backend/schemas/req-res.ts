import { Type, Static } from '@sinclair/typebox'

// Generic req/res
export const Request = Type.Object({
  type: Type.Literal('req'),
  id: Type.String(),
  method: Type.String(), // health, status, send, agent, system-presence
  params: Type.Any()
})

export type RequestType = Static<typeof Request>

export const Response = Type.Union([
  Type.Object({
    type: Type.Literal('res'),
    id: Type.String(),
    ok: Type.Literal(true),
    payload: Type.Any()
  }),
  Type.Object({
    type: Type.Literal('res'),
    id: Type.String(),
    ok: Type.Literal(false),
    error: Type.Object({
      code: Type.String(),
      message: Type.String()
    })
  })
])

export type ResponseType = Static<typeof Response>

