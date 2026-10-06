"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { ConflictCard, type MatterConflict } from "@/components/matters";

const PRACTICE_AREAS = ["Corporate", "Commercial", "Employment", "Litigation", "Property", "Family", "Criminal", "IP", "Tax"];
const BILLING_ARRANGEMENTS = ["hourly", "fixed", "contingency", "retainer", "pro-bono"];

export function NewMatterPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [practiceArea, setPracticeArea] = React.useState("Corporate");
  const [billing, setBilling] = React.useState("hourly");
  const [conflict, setConflict] = React.useState<MatterConflict | null>(null);
  const [checkingConflicts, setCheckingConflicts] = React.useState(false);

  const runConflictCheck = async () => {
    if (!clientName.trim()) { toast.error("Enter a client name first"); return; }
    setCheckingConflicts(true);
    // POST /api/matters/conflicts/check { query: clientName }
    setTimeout(() => {
      setConflict({ id: "c1", query: clientName, severity: "none", matches: [] });
      setCheckingConflicts(false);
    }, 700);
  };

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!clientName.trim()) { toast.error("Client name is required"); return; }
    if (conflict && conflict.severity !== "none") { toast.error("Resolve conflicts before opening matter"); return; }
    toast.success("Matter created");
    router.push(`/legalai/matters/new-${Date.now()}/overview`);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">New</p>
        <h1 className="text-lg font-semibold">Open a matter</h1>
      </header>
      <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
        <Card className="space-y-4 p-4">
          <div><Label htmlFor="m-name">Matter name *</Label><Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme v Bolt — commercial dispute" /></div>
          <div>
            <Label htmlFor="m-client">Client *</Label>
            <div className="flex gap-2">
              <Input id="m-client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Acme Sdn Bhd" />
              <Button type="button" variant="outline" disabled={checkingConflicts} onClick={runConflictCheck}>{checkingConflicts ? "Checking…" : "Run conflict check"}</Button>
            </div>
          </div>
          <div><Label htmlFor="m-desc">Description</Label><Textarea id="m-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Practice area</Label>
              <Select value={practiceArea} onValueChange={setPracticeArea}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRACTICE_AREAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Billing arrangement</Label>
              <Select value={billing} onValueChange={setBilling}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BILLING_ARRANGEMENTS.map((b) => <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {conflict ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Conflict check</h2>
            <ConflictCard conflict={conflict} />
            {conflict.severity === "none" ? <Badge variant="secondary" className="text-[10px]">No conflicts detected — safe to proceed</Badge> : null}
          </section>
        ) : null}

        <div className="flex gap-2">
          <Button onClick={handleCreate} disabled={!name.trim() || !clientName.trim() || (conflict ? conflict.severity !== "none" : false)}>Open matter</Button>
          <Button asChild variant="ghost"><Link href="/legalai/matters">Cancel</Link></Button>
        </div>
      </div>
    </div>
  );
}
