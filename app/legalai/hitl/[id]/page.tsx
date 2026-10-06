import { HITLDetailClient } from "./detail-client";

export default function Page({ params }: { params: { id: string } }) {
  return <HITLDetailClient id={params.id} />;
}
