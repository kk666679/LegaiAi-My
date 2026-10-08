import { redirect } from "next/navigation";
export default function Page({ params }: { params: { id: string } }) {
  redirect(`/lawmate/agents/${params.id}/overview`);
}
