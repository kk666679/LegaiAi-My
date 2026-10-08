import { Type } from '@sinclair/typebox';
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
        caps: Type.Optional(Type.Array(Type.String())),
        commands: Type.Optional(Type.Array(Type.String())),
    })
});
export const ConnectResponseHelloOk = Type.Object({
    type: Type.Literal('hello'),
    ok: Type.Boolean(),
});
//# sourceMappingURL=connect.js.map