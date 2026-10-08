// app/automations/[id]/analytics/page.tsx
import { WorkflowAnalyticsPage } from "./analytics-client";

export default function Page({ params }: { params: { id: string } }) {
  return <WorkflowAnalyticsPage id={params.id} />;
}
