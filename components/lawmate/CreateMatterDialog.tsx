"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Loader2 } from "lucide-react";
import { LEGAL_AREAS } from "@/lib/lawmate/data";
import type { Matter } from "@/types/lawmate";

interface CreateMatterDialogProps {
  trigger?: React.ReactNode;
  onCreate?: (matter: Matter) => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function CreateMatterDialog({
  trigger,
  onCreate,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateMatterDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (controlledOnOpenChange) controlledOnOpenChange(v);
    else setInternalOpen(v);
  };
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [area, setArea] = useState("Employment");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const created: Matter = {
      id: `m-${Date.now()}`,
      number: `M-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
      name,
      client: client || undefined,
      description,
      status: "active",
      priority,
      area: area as Matter["area"],
      documentsCount: 0,
      conversationsCount: 0,
      tasksCount: 0,
      researchCount: 0,
      updatedAt: new Date().toISOString(),
      classification: "internal",
    };
    onCreate?.(created);
    setSubmitting(false);
    setOpen(false);
    setName("");
    setClient("");
    setDescription("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="size-4" /> New matter
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Briefcase className="size-4 text-primary" /> Create matter
          </SheetTitle>
          <SheetDescription>
            Organise documents, conversations and tasks for a new legal matter.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="space-y-4 p-4 flex-1 overflow-y-auto">
          <div>
            <Label className="text-xs">Matter name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ABC Holdings v XYZ Corp"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Client</Label>
            <Input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Client name (optional)"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Area</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_AREAS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary (optional)"
              className="mt-1 min-h-[100px]"
            />
          </div>
          <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            <Badge variant="outline" className="mr-2 text-[10px]">
              Tip
            </Badge>
            You can attach documents and assign tasks once the matter is created.
          </div>
        </form>
        <SheetFooter className="border-t p-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !name.trim()}
            onClick={submit}
            className="gap-2"
          >
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Create matter
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}