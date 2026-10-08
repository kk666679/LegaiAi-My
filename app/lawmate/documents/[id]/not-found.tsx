import { DocumentNotFound } from "@/components/documents";
import Link from "next/link";
import { LawMateMark } from "@/components/navigation/Logo";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <LawMateMark size="md" className="text-muted-foreground/40" aria-hidden="true" />
      <DocumentNotFound onBack={() => { window.location.href = "/lawmate/documents"; }} />
    </div>
  );
}
