"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpcReact } from "@/clients";

const MATTER_TYPES = [
  { value: "LITIGATION", label: "Litigation" },
  { value: "CONTRACT", label: "Contract" },
  { value: "ADVISORY", label: "Advisory" },
  { value: "COMPLIANCE", label: "Compliance" },
  { value: "CONVEYANCING", label: "Conveyancing" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "CRIMINAL", label: "Criminal" },
  { value: "FAMILY", label: "Family" },
  { value: "EMPLOYMENT", label: "Employment" },
  { value: "IP", label: "Intellectual property" },
] as const;

interface CreateMatterDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: {
    clientId: string;
    title: string;
    matterType: string;
    priority: string;
    jurisdiction: string;
    caseNumber?: string;
    description?: string;
    assignedTo?: string;
    deadlineAt?: string;
  }) => Promise<void>;
}

export function CreateMatterDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSubmit,
}: CreateMatterDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    controlledOnOpenChange?.(value);
    if (controlledOpen === undefined) setInternalOpen(value);
  };
  const [title, setTitle] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [matterType, setMatterType] =
    useState<(typeof MATTER_TYPES)[number]["value"]>("EMPLOYMENT");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">(
    "medium",
  );
  const [description, setDescription] = useState("");
  const clientsQuery = trpcReact.clients.list.useQuery(
    { search: clientSearch || undefined, limit: 25 },
    { enabled: open, retry: false },
  );
  const createMatter = trpcReact.matters.create.useMutation();
  const utils = trpcReact.useUtils();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !clientId) return;

    try {
      if (onSubmit) {
        await onSubmit({
          clientId,
          title: title.trim(),
          matterType,
          priority,
          jurisdiction: "MY",
          description: description.trim() || undefined,
        });
      } else {
        await createMatter.mutateAsync({
          clientId,
          title: title.trim(),
          matterType,
          priority,
          jurisdiction: "MY",
          description: description.trim() || undefined,
        });
      }
      setTitle("");
      setClientSearch("");
      setClientId("");
      setDescription("");
      setOpen(false);
      toast.success("Matter created");
      void Promise.all([
        utils.matters.list.invalidate(),
        utils.matters.stats.invalidate(),
      ]).catch((error) => {
        toast.error("Matter created, but the list could not refresh", {
          description:
            error instanceof Error ? error.message : "Refresh the page to see it.",
        });
      });
    } catch (error) {
      toast.error("Could not create matter", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const clients = clientsQuery.data?.clients ?? [];

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
            Create a matter linked to an existing client in your workspace.
          </SheetDescription>
        </SheetHeader>
        <form
          id="create-matter-form"
          onSubmit={submit}
          className="flex-1 space-y-4 overflow-y-auto p-4"
        >
          <div className="space-y-1">
            <Label htmlFor="matter-title" className="text-xs">
              Matter name *
            </Label>
            <Input
              id="matter-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. ABC Holdings v XYZ Corp"
              maxLength={500}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="matter-client-search" className="text-xs">
              Client *
            </Label>
            <Input
              id="matter-client-search"
              value={clientSearch}
              onChange={(event) => {
                setClientSearch(event.target.value);
                setClientId("");
              }}
              placeholder="Search existing clients"
            />
            {clientsQuery.isError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Could not load clients: {clientsQuery.error.message}
                </AlertDescription>
              </Alert>
            ) : clients.length > 0 ? (
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger aria-label="Select a client">
                  <SelectValue
                    placeholder={
                      clientsQuery.isLoading ? "Loading clients…" : "Select a client"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: { id: string; name: string }) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : clientsQuery.isLoading ? (
              <p className="text-xs text-muted-foreground">Loading clients…</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No matching clients.{" "}
                <Link className="text-primary underline" href="/legalai/clients">
                  Create a client first
                </Link>
                .
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Matter type</Label>
              <Select
                value={matterType}
                onValueChange={(value: (typeof MATTER_TYPES)[number]["value"]) =>
                  setMatterType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATTER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value: typeof priority) => setPriority(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="matter-description" className="text-xs">
              Description
            </Label>
            <Textarea
              id="matter-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Brief summary (optional)"
              className="min-h-[100px]"
            />
          </div>
          {createMatter.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Could not create matter: {createMatter.error.message}
              </AlertDescription>
            </Alert>
          ) : null}
        </form>
        <SheetFooter className="border-t p-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            type="button"
            disabled={createMatter.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-matter-form"
            disabled={
              createMatter.isPending ||
              !title.trim() ||
              !clientId ||
              clientsQuery.isError
            }
            className="gap-2"
          >
            {createMatter.isPending && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            Create matter
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
