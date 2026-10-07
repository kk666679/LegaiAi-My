import { ResearchCitationsPage } from "../../_components/research-citations";

export default function Page({ params }: { params: { sessionId: string } }) {
  return <ResearchCitationsPage id={params.sessionId} />;
}
