import { redirect } from "next/navigation";
export default function Page({ params }: { params: { id: string } }) {
  redirect(`/legalai/matters/${params.id}?tab=overview`);
}