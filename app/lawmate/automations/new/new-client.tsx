"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_TEMPLATES } from "@/components/automation";
import { TemplateCard } from "@/components/automation/templates/template-card";
import { toast } from "sonner";
import Link from "next/link";

export function NewWorkflowPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [templateId, setTemplateId] = React.useState<string | null>(null);

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    // POST /api/automations { name, description, templateId }
    // Then redirect to /automations/{id}/builder
    const id = `wf-${Date.now()}`;
    toast.success("Workflow created");
    router.push(`/lawmate/automations/${id}/builder${templateId ? `?template=${templateId}` : ""}`);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">New</p>
        <h1 className="text-lg font-semibold">Create a workflow</h1>
      </header>
      <div className="space-y-6 p-6 max-w-4xl">
        <Card className="space-y-4 p-4">
          <div>
            <Label htmlFor="wf-name">Name *</Label>
            <Input id="wf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Client intake automation" />
          </div>
          <div>
            <Label htmlFor="wf-desc">Description</Label>
            <Textarea id="wf-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this workflow do?" />
          </div>
        </Card>

        <section>
          <h2 className="mb-3 text-sm font-medium">Start from a template <span className="text-muted-foreground">(optional)</span></h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DEFAULT_TEMPLATES.map((t) => (
              <div key={t.id} className={templateId === t.id ? "ring-2 ring-primary rounded-lg" : ""}>
                <TemplateCard template={t} onUse={() => setTemplateId(templateId === t.id ? null : t.id)} />
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-2">
          <Button onClick={handleCreate} disabled={!name.trim()}>Create workflow</Button>
          <Button asChild variant="ghost"><Link href="/lawmate/automations">Cancel</Link></Button>
        </div>
      </div>
    </div>
  );
}
