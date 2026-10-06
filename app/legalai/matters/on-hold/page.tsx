import { redirect } from "next/navigation";
export default function Page() {
  redirect("/legalai/matters?status=on_hold");
}