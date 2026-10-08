"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpcReact } from "@/clients";

function OAuthCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const complete = trpcReact.automations.completeIntegrationOAuth.useMutation();
  const state = params.get("state");
  const code = params.get("code");
  const providerError = params.get("error");
  const [message, setMessage] = React.useState("Completing integration connection…");
  const started = React.useRef(false);

  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (providerError) {
      setMessage("Authorization was cancelled or rejected by the provider.");
      return;
    }
    if (!state || !code) {
      setMessage("The provider callback is missing its authorization details.");
      return;
    }
    complete.mutate({ state, code }, {
      onSuccess: async () => {
        setMessage("Integration connected. Returning to settings…");
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.replace("/lawmate/settings/integrations");
      },
      onError: (error: Error) => setMessage(error.message || "Could not complete integration authorization."),
    });
  }, [code, complete, providerError, router, state]);

  return <main className="mx-auto max-w-lg p-8 text-center"><h1 className="text-lg font-semibold">Integration authorization</h1><p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p></main>;
}

export default function IntegrationOAuthCallbackPage() {
  return <React.Suspense fallback={<main className="p-8 text-center text-sm text-muted-foreground">Loading authorization…</main>}><OAuthCallback /></React.Suspense>;
}
