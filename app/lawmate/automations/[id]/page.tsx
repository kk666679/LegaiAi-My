// app/automations/[id]/page.tsx
import { redirect } from "next/navigation";

export default function Page({ params }: { params: { id: string } }) {
  redirect(`/lawmate/automations/${params.id}/builder`);
}
