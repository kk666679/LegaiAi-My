import { Type } from '@sinclair/typebox';
export const HelloOkResponse = Type.Object({
    type: Type.Literal('res'),
    id: Type.String(),
    ok: Type.Literal(true),
    payload: Type.Object({
        features: Type.Object({
            methods: Type.Array(Type.String()),
            events: Type.Array(Type.String())
        }),
        snapshot: Type.Object({
            presence: Type.Any(),
            health: Type.Object({
                status: Type.Literal('healthy'),
                uptime: Type.Number(),
                providers: Type.Array(Type.String())
            })
        })
    })
});
//# sourceMappingURL=hello-ok.js.map