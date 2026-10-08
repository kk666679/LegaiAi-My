import { AuthorityDetailPage } from "../../../_components/authority-detail";

export default function Page({ params }: { params: { sessionId: string; authorityId: string } }) {
  return <AuthorityDetailPage sessionId={params.sessionId} authorityId={params.authorityId} />;
}
