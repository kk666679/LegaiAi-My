import { AgentSettingsTab } from "../../_components/agent-tabs";
export default function Page({ params }: { params: { id: string } }) {
  return <AgentSettingsTab id={params.id} />;
}
