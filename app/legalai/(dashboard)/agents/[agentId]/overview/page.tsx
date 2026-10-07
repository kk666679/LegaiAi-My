import { AgentDetailPage } from "../../_components/agent-detail-page";
export default async function Page({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  return <AgentDetailPage id={agentId} />;
}