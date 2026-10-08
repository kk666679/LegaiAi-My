import { AgentLogsTab } from "../_components/agent-tabs";
export default function Page({ params }: { params: { id: string } }) {
  return <AgentLogsTab id={params.id} />;
}
