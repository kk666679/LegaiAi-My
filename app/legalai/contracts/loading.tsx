import { ContractLoading } from "@/components/contracts";
import { LawMateMark } from "@/components/navigation/Logo";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-10">
      <LawMateMark size="lg" className="text-muted-foreground/40" aria-hidden="true" />
      <div className="w-full"><ContractLoading /></div>
    </div>
  );
}
