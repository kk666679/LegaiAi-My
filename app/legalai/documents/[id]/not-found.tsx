import { DocumentNotFound } from "@/components/documents";
import Link from "next/link";
export default function NotFound() {
  return (
    <div className="p-6">
      <DocumentNotFound onBack={() => { window.location.href = "/legalai/documents"; }} />
    </div>
  );
}
