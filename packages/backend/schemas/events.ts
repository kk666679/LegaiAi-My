import { Type, Static } from '@sinclair/typebox'

export const Event = Type.Object({
  type: Type.Literal('event'),
  event: Type.Union([
    Type.Literal('agent'),
    Type.Literal('chat'),
    Type.Literal('presence'),
    Type.Literal('health'),
    Type.Literal('heartbeat'),
    Type.Literal('cron'),
    Type.Literal('tick')
  ]),
  payload: Type.Any(),
  seq: Type.Optional(Type.Number()),
  stateVersion: Type.Optional(Type.String())
})

export type EventType = Static<typeof Event>

