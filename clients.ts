import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/backend/src/trpc/routers/_app';

type ReactRouter = ReturnType<typeof createTRPCReact<AppRouter>>;

// Create a properly typed tRPC React client
export const trpcReact: ReactRouter = createTRPCReact<AppRouter>();

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Export the Provider component
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return children;
}

// Export a properly typed TRPCReactProvider for compatibility
export const TRPCReactProvider = TRPCProvider;
