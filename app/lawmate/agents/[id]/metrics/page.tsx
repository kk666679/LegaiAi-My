import { AgentMetricsTab } from "../_components/agent-tabs";
export default function Page({ params }: { params: { id: string } }) {
  return <AgentMetricsTab id={params.id} />;
}
