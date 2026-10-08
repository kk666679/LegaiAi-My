import { Type } from '@sinclair/typebox';
export const Request = Type.Object({
    type: Type.Literal('req'),
    id: Type.String(),
    method: Type.String(),
    params: Type.Any()
});
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
]);
//# sourceMappingURL=req-res.js.map