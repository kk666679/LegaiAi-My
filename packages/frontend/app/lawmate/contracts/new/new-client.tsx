"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContractTemplateLibrary, DEFAULT_CONTRACT_TEMPLATES, type ContractTemplate } from "@/components/contracts";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpcReact } from "@/clients";

export function NewContractClient() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [counterparty, setCounterparty] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [template, setTemplate] = React.useState<ContractTemplate | null>(null);
  const createContract = trpcReact.contracts.create.useMutation();
  const utils = trpcReact.useUtils();

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }

    const contractType = (template?.contractType?.toUpperCase() ?? "OTHER") as
      | "NDA" | "SERVICE" | "EMPLOYMENT" | "LEASE" | "SALE" | "LOAN" | "PARTNERSHIP" | "OTHER";

    try {
      const created = await createContract.mutateAsync({
        title: name.trim(),
        contractType,
        counterparty: counterparty.trim() || undefined,
        content: description.trim() || undefined,
      });
      await utils.contracts.list.invalidate();
      toast.success("Contract created");
      router.push(`/lawmate/contracts/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create contract");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">New</p>
        <h1 className="text-lg font-semibold">Create a contract</h1>
      </header>
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        <Card className="space-y-4 p-4">
          <div><Label htmlFor="c-name">Contract name *</Label><Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Services Agreement — Acme" /></div>
          <div><Label htmlFor="c-counter">Counterparty</Label><Input id="c-counter" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="e.g. Acme Sdn Bhd" /></div>
          <div><Label htmlFor="c-desc">Description</Label><Textarea id="c-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </Card>
        <section>
          <h2 className="mb-3 text-sm font-medium">Start from a template <span className="text-muted-foreground">(optional)</span></h2>
          <ContractTemplateLibrary templates={DEFAULT_CONTRACT_TEMPLATES} onUse={(t) => setTemplate(template?.id === t.id ? null : t)} />
        </section>
        <div className="flex gap-2">
          <Button onClick={() => void handleCreate()} disabled={!name.trim() || createContract.isPending}>
            {createContract.isPending ? "Creating…" : "Create contract"}
          </Button>
          <Button asChild variant="ghost"><Link href="/lawmate/contracts">Cancel</Link></Button>
        </div>
      </div>
    </div>
  );
}
