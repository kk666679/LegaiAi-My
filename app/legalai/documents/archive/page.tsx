import { redirect } from "next/navigation";
export default function Page() {
  redirect("/legalai/documents?status=archived");
}