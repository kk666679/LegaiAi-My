import { Static } from '@sinclair/typebox';
export declare const Request: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<"req">;
    id: import("@sinclair/typebox").TString;
    method: import("@sinclair/typebox").TString;
    params: import("@sinclair/typebox").TAny;
}>;
export type RequestType = Static<typeof Request>;
export declare const Response: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<"res">;
    id: import("@sinclair/typebox").TString;
    ok: import("@sinclair/typebox").TLiteral<true>;
    payload: import("@sinclair/typebox").TAny;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<"res">;
    id: import("@sinclair/typebox").TString;
    ok: import("@sinclair/typebox").TLiteral<false>;
    error: import("@sinclair/typebox").TObject<{
        code: import("@sinclair/typebox").TString;
        message: import("@sinclair/typebox").TString;
    }>;
}>]>;
export type ResponseType = Static<typeof Response>;
