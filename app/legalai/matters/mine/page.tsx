import { redirect } from "next/navigation";
export default function Page() {
  redirect("/legalai/matters?assignedTo=me");
}