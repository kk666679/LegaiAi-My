import { Static } from '@sinclair/typebox';
export declare const ConnectRequest: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<"connect">;
    params: import("@sinclair/typebox").TObject<{
        auth: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            token: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            password: import("@sinclair/typebox").TString;
        }>]>;
        role: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"client">, import("@sinclair/typebox").TLiteral<"node">]>>;
        deviceIdentity: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        challengeSignature: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        caps: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
        commands: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    }>;
}>;
export type ConnectRequestType = Static<typeof ConnectRequest>;
export declare const ConnectResponseHelloOk: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<"hello">;
    ok: import("@sinclair/typebox").TBoolean;
}>;
export type ConnectResponseHelloOkType = Static<typeof ConnectResponseHelloOk>;
