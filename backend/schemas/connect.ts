import { Type, Static } from '@sinclair/typebox'

// Core connect handshake
export const ConnectRequest = Type.Object({
  type: Type.Literal('connect'),
  params: Type.Object({
    auth: Type.Union([
      Type.Object({
        token: Type.String()
      }),
      Type.Object({
        password: Type.String()
      })
    ]),
    role: Type.Optional(Type.Union([Type.Literal('client'), Type.Literal('node')])),
    deviceIdentity: Type.Optional(Type.String()),
    challengeSignature: Type.Optional(Type.String()),
    caps: Type.Optional(Type.Array(Type.String())), // node capabilities
    commands: Type.Optional(Type.Array(Type.String())), // node commands like canvas.*, camera.*
  })
})

export type ConnectRequestType = Static<typeof ConnectRequest>

export const ConnectResponseHelloOk = Type.Object({
  type: Type.Literal('hello'),
  ok: Type.Boolean(),
})

export type ConnectResponseHelloOkType = Static<typeof ConnectResponseHelloOk>
