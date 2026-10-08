import { redirect } from "next/navigation";
export default function Page({ params }: { params: { sessionId: string } }) {
  redirect(`/legalai/research/${params.sessionId}/results`);
}
