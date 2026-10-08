import { redirect } from "next/navigation";
export default function Page() {
  redirect("/lawmate/documents?status=draft");
}