// app/automations/[id]/versions/page.tsx
import { WorkflowVersionsPage } from "./versions-client";

export default function Page({ params }: { params: { id: string } }) {
  return <WorkflowVersionsPage id={params.id} />;
}
