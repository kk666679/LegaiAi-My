// app/legalai/research/[sessionId]/results/page.tsx
import { ResearchResultsPage } from "../../_components/research-results";

export default function Page({ params }: { params: { sessionId: string } }) {
  return <ResearchResultsPage id={params.sessionId} />;
}
