import { redirect } from "next/navigation";

export default function Page() {
  // The audit trail viewer lives under the agents module.
  redirect("/legalai/agents/audit");
}
