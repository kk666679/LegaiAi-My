import { AgentRunsTab } from "../_components/agent-tabs";
export default function Page({ params }: { params: { id: string } }) {
  return <AgentRunsTab id={params.id} />;
}
