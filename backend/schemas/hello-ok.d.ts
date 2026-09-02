import { Static } from '@sinclair/typebox';
export declare const HelloOkResponse: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<"res">;
    id: import("@sinclair/typebox").TString;
    ok: import("@sinclair/typebox").TLiteral<true>;
    payload: import("@sinclair/typebox").TObject<{
        features: import("@sinclair/typebox").TObject<{
            methods: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
            events: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        }>;
        snapshot: import("@sinclair/typebox").TObject<{
            presence: import("@sinclair/typebox").TAny;
            health: import("@sinclair/typebox").TObject<{
                status: import("@sinclair/typebox").TLiteral<"healthy">;
                uptime: import("@sinclair/typebox").TNumber;
                providers: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
            }>;
        }>;
    }>;
}>;
export type HelloOkResponseType = Static<typeof HelloOkResponse>;
