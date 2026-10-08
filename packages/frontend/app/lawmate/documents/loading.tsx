import { LawMateMark } from "@/components/navigation/Logo";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10">
      <LawMateMark size="lg" className="text-muted-foreground/40" aria-hidden="true" />
      <div className="h-2 w-32 animate-pulse rounded bg-muted" />
    </div>
  );
}
