import { AgentDetailPage } from "../../_components/agent-detail-page";
export default function Page({ params }: { params: { id: string } }) {
  return <AgentDetailPage id={params.id} />;
}
