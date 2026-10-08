import { redirect } from "next/navigation";
export default function Page({ params }: { params: { id: string } }) {
  redirect(`/lawmate/matters/${params.id}?tab=overview`);
}