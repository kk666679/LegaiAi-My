// app/automations/runs/[runId]/page.tsx
import { RunDetailPage } from "./run-client";

export default function Page({ params }: { params: { runId: string } }) {
  return <RunDetailPage runId={params.runId} />;
}
