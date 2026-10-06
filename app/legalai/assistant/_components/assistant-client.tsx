"use client";
// app/ai/_components/assistant-client.tsx
import * as React from "react";
import { useRouter } from "next/navigation";
import { AIAssistantWorkspace } from "./assistant-workspace";
import { useAIAssistant } from "./use-ai-assistant";

export function AIAssistantPage() {
  const router = useRouter();
  const assistant = useAIAssistant({
    onNavigate: (href) => router.push(href),
  });

  return <AIAssistantWorkspace {...assistant} />;
}
