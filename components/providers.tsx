"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpcReact } from "@/clients";
import { ThemeProvider } from "next-themes";
import { getToken } from "@/lib/auth";
import { AuthProvider } from "@/components/auth-provider";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpcReact.createClient({
      links: [
        httpBatchLink({
          // Inlined at build time. "/trpc" is only correct where an edge proxy
          // routes that path straight to the backend (Caddy in
          // docker-compose.prod.yml); "/api/trpc" relays through this app's
          // own route handler, which is what Fly and local dev need because the
          // frontend origin cannot serve /trpc itself.
          url: process.env.NEXT_PUBLIC_TRPC_URL || "/api/trpc",
          headers: () => {
            const token = getToken();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpcReact.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </AuthProvider>
    </TRPCProvider>
  );
}
