import { ResearchMemoPage } from "../../_components/research-memo";

export default function Page({ params }: { params: { sessionId: string } }) {
  return <ResearchMemoPage id={params.sessionId} />;
}
