// app/automations/[id]/runs/page.tsx
import { WorkflowRunsPage } from "./runs-client";

export default function Page({ params }: { params: { id: string } }) {
  return <WorkflowRunsPage id={params.id} />;
}
