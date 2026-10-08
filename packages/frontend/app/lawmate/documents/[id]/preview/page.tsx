import { redirect } from "next/navigation";
export default function Page({ params }: { params: { id: string } }) {
  redirect(`/lawmate/documents/${params.id}?tab=preview`);
}