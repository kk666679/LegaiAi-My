import { ResearchSessionOverview } from "../../_components/research-session-overview";

export default function Page({ params }: { params: { sessionId: string } }) {
  return <ResearchSessionOverview id={params.sessionId} />;
}
