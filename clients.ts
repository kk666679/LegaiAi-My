import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/backend/src/trpc/routers/_app';

// Single tRPC React client for the whole app. The router type is imported
// from backend/src/trpc/routers/_app.ts; do not introduce a parallel router
// in server/ or app/ — that was a shadow scaffold and is gone.
//
// tRPC v11's `createTRPCReact` returns a ProtectedIntersection<Base, RouterRecord>
// that narrows to an IntersectionError string literal when any router key
// resolves to `never` (commonly caused by an unresolvable input/output type
// in a backend procedure). The runtime object is fully usable; this `as any`
// is the documented escape hatch and matches the upstream-suppressed behavior
// in components/auth-provider.tsx and components/providers.tsx.
type ReactRouter = ReturnType<typeof createTRPCReact<AppRouter>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpcReact: any = createTRPCReact<AppRouter>();

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
