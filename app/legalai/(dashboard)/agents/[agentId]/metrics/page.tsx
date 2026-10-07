import { AgentMetricsTab } from "../../_components/agent-tabs";
export default async function Page({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  return <AgentMetricsTab id={agentId} />;
}