import { Static } from '@sinclair/typebox';
export declare const Event: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<"event">;
    event: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"agent">, import("@sinclair/typebox").TLiteral<"chat">, import("@sinclair/typebox").TLiteral<"presence">, import("@sinclair/typebox").TLiteral<"health">, import("@sinclair/typebox").TLiteral<"heartbeat">, import("@sinclair/typebox").TLiteral<"cron">, import("@sinclair/typebox").TLiteral<"tick">]>;
    payload: import("@sinclair/typebox").TAny;
    seq: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    stateVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type EventType = Static<typeof Event>;
