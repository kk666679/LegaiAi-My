import { ResearchReasoningPage } from "../../_components/research-reasoning";

export default function Page({ params }: { params: { sessionId: string } }) {
  return <ResearchReasoningPage id={params.sessionId} />;
}
