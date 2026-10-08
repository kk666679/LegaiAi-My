import { StudioClient } from "../../studio/studio-client";
export const metadata = { title: "Drafting Studio — Documents" };
export default function Page({ params }: { params: { id: string } }) {
  return <StudioClient documentId={params.id} />;
}