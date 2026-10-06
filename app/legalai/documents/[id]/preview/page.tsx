import { redirect } from "next/navigation";
export default function Page({ params }: { params: { id: string } }) {
  redirect(`/legalai/documents/${params.id}?tab=preview`);
}