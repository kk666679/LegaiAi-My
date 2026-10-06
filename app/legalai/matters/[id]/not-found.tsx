import { MatterNotFound } from "@/components/matters";
import { LawMateMark } from "@/components/navigation/Logo";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <LawMateMark size="md" className="text-muted-foreground/40" aria-hidden="true" />
      <MatterNotFound />
    </div>
  );
}
