import { ResearchTimelinePage } from "../../_components/research-timeline";

export default function Page({ params }: { params: { sessionId: string } }) {
  return <ResearchTimelinePage id={params.sessionId} />;
}
