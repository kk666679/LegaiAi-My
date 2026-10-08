import { redirect } from "next/navigation";
export default function Page({ params }: { params: { id: string } }) {
  redirect(`/legalai/agents/${params.id}/overview`);
}
