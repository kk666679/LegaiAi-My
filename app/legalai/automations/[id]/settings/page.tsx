// app/automations/[id]/settings/page.tsx
import { WorkflowSettingsPage } from "./settings-client";

export default function Page({ params }: { params: { id: string } }) {
  return <WorkflowSettingsPage id={params.id} />;
}
