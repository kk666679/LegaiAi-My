import { redirect } from "next/navigation";
export default function Page() {
  redirect("/lawmate/contracts?withinDays=90");
}