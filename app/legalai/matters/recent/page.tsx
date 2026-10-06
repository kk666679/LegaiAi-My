import { redirect } from "next/navigation";
export default function Page() {
  redirect("/legalai/matters?sort=updatedAt");
}