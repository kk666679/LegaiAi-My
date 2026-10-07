import { redirect } from "next/navigation";
export default function Page() {
  redirect("/legalai/documents?docType=CONTRACT");
}