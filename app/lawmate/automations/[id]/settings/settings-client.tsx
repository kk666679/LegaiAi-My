// app/lawmate/automations/[id]/settings/settings-client.tsx
"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { trpcReact } from "@/clients";
import { useParams } from "next/navigation";
import Link from "next/link";

export function WorkflowSettingsPage({ id }: { id: string }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<"draft" | "active" | "paused" | "archived">("draft");
  const [category, setCategory] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const workflowId = React.useMemo(() => id, [id]);

  React.useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const automation = await trpcReact.automations.get.query({ id: workflowId });
        setName(automation.name);
        setDescription(automation.description ?? "");
        setStatus(automation.status);
        setCategory(automation.category ?? "");
      } catch (err) {
        setError(`Failed to load workflow: ${(err as Error)?.message ?? "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [workflowId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await trpcReact.automations.update.mutate({
        id: workflowId,
        name,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        tags: [], // Tags would need a separate UI - keeping simple for now
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(`Failed to save settings: ${(err as Error)?.message ?? "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetStatus = async (newStatus: typeof status) => {
    try {
      await trpcReact.automations.setStatus.mutate({ id: workflowId, status: newStatus });
      setStatus(newStatus);
      toast.success(`Workflow ${newStatus}`);
    } catch (err) {
      toast.error(`Failed to update status: ${(err as Error)?.message ?? "Unknown error"}`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this workflow? This action cannot be undone.")) return;
    try {
      await trpcReact.automations.remove.mutate({ id: workflowId });
      toast.success("Workflow deleted");
      // Navigate back to list
      window.location.href = "/lawmate/automations";
    } catch (err) {
      toast.error(`Failed to delete workflow: ${(err as Error)?.message ?? "Unknown error"}`);
    }
  };

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading settings…</p>;
  }

  if (error) {
    return <p className="p-6 text-xs text-destructive">{error}</p>;
  }

  return (
    <div className="max-w-2xl space-y-4 p-6">
      <Card className="space-y-4 p-4">
        <div>
          <Label htmlFor="s-name">Name</Label>
          <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="s-desc">Description</Label>
          <Textarea id="s-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => {
              setStatus(v as typeof status);
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="s-cat">Category</Label>
            <Input id="s-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Matters, Documents…" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className={isSaving ? "opacity-50" : ""}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/lawmate/automations">Back to workflows</Link>
          </Button>
        </div>
      </Card>

      <Card className="border-destructive/40 p-4">
        <p className="text-sm font-medium text-destructive">Danger zone</p>
        <p className="mt-1 text-xs text-muted-foreground">Deleting a workflow is permanent and removes all run history.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="mt-3 border-destructive/40 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              Delete workflow
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                onClick={handleDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}