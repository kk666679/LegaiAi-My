import { createTRPCReact } from '@trpc/react-query';
import type { AnyRouter } from '@trpc/server';

// Create a properly typed tRPC React client
export const trpcReact = createTRPCReact<AnyRouter>();

// Export the Provider component
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return children;
}

// Export a properly typed TRPCReactProvider for compatibility
export const TRPCReactProvider = TRPCProvider;

// Note: You'll need to configure this with your actual router
// For now, this provides a type-safe stub
