import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ documentId?: string | string[] }>;
}) {
  const params = await searchParams;
  const documentId = Array.isArray(params.documentId)
    ? params.documentId[0]
    : params.documentId;

  if (documentId) {
    redirect(`/lawmate/documents/${encodeURIComponent(documentId)}?tab=analysis`);
  }

  redirect("/lawmate/documents");
}
