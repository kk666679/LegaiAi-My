"use client";

import { useState } from "react";
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
import { Plus, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpcReact } from "@/clients";

const CONTRACT_TYPES = [
  { value: "MSA", label: "Master Services Agreement" },
  { value: "NDA", label: "Non-Disclosure Agreement" },
  { value: "EMPLOYMENT", label: "Employment Contract" },
  { value: "SALE", label: "Sale & Purchase Agreement" },
  { value: "LEASE", label: "Lease Agreement" },
  { value: "LICENSING", label: "Licensing Agreement" },
  { value: "PARTNERSHIP", label: "Partnership Agreement" },
  { value: "LOAN", label: "Loan Agreement" },
  { value: "OTHER", label: "Other" },
] as const;

interface CreateContractDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: {
    clientId?: string;
    matterId?: string;
    title: string;
    contractType: string;
    counterparty?: string;
    value?: number;
    currency?: string;
    effectiveDate?: string;
    expiryDate?: string;
    autoRenew?: boolean;
    renewalNoticeDays?: number;
    content?: string;
  }) => Promise<void>;
}

export function CreateContractDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSubmit,
}: CreateContractDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    controlledOnOpenChange?.(value);
    if (controlledOpen === undefined) setInternalOpen(value);
  };
  const [title, setTitle] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [matterId, setMatterId] = useState("");
  const [contractType, setContractType] = useState<typeof CONTRACT_TYPES[number]["value"]>("MSA");
  const [counterparty, setCounterparty] = useState("");
  const [value, setValue] = useState<number | "">(0);
  const [currency, setCurrency] = useState("MYR");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [renewalNoticeDays, setRenewalNoticeDays] = useState(30);
  const [content, setContent] = useState("");
  const clientsQuery = trpcReact.clients.list.useQuery(
    { search: clientSearch || undefined, limit: 25 },
    { enabled: open, retry: false },
  );
  const mattersQuery = trpcReact.matters.list.useQuery(
    { search: clientSearch || undefined, limit: 25 },
    { enabled: open, retry: false },
  );
  const createContract = trpcReact.contracts.create.useMutation();
  const utils = trpcReact.useUtils();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    try {
      if (onSubmit) {
        await onSubmit({
          clientId: clientId || undefined,
          matterId: matterId || undefined,
          title: title.trim(),
          contractType,
          counterparty: counterparty.trim() || undefined,
          value: value ? Number(value) : undefined,
          currency,
          effectiveDate: effectiveDate || undefined,
          expiryDate: expiryDate || undefined,
          autoRenew,
          renewalNoticeDays,
          content: content.trim() || undefined,
        });
      } else {
        await createContract.mutateAsync({
          clientId: clientId || undefined,
          matterId: matterId || undefined,
          title: title.trim(),
          contractType,
          counterparty: counterparty.trim() || undefined,
          value: value ? Number(value) : undefined,
          currency,
          effectiveDate: effectiveDate ? new Date(effectiveDate).toISOString() : undefined,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          autoRenew,
          renewalNoticeDays,
          content: content.trim() || undefined,
        });
      }
      setTitle("");
      setClientSearch("");
      setClientId("");
      setMatterId("");
      setCounterparty("");
      setValue("");
      setEffectiveDate("");
      setExpiryDate("");
      setAutoRenew(false);
      setRenewalNoticeDays(30);
      setContent("");
      setOpen(false);
      toast.success("Contract created");
      void Promise.all([
        utils.contracts.list.invalidate(),
        utils.contracts.stats.invalidate(),
      ]).catch((error) => {
        toast.error("Contract created, but the list could not refresh", {
          description:
            error instanceof Error ? error.message : "Refresh the page to see it.",
        });
      });
    } catch (error) {
      toast.error("Could not create contract", {
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
            <Plus className="size-4" /> New contract
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" /> Create contract
          </SheetTitle>
          <SheetDescription>
            Create a new contract linked to a client and matter.
          </SheetDescription>
        </SheetHeader>
        <form
          id="create-contract-form"
          onSubmit={submit}
          className="flex-1 space-y-4 overflow-y-auto p-4"
        >
          <div className="space-y-1">
            <Label htmlFor="contract-title" className="text-xs">
              Contract name *
            </Label>
            <Input
              id="contract-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Master Services Agreement - ABC Corp"
              maxLength={500}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-client-search" className="text-xs">
              Client (optional)
            </Label>
            <Input
              id="contract-client-search"
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
                      clientsQuery.isLoading ? "Loading clients…" : "Select a client (optional)"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
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
                No matching clients.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Contract type</Label>
              <Select
                value={contractType}
                onValueChange={(value: typeof CONTRACT_TYPES[number]["value"]) =>
                  setContractType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MYR">MYR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="contract-counterparty" className="text-xs">
              Counterparty (optional)
            </Label>
            <Input
              id="contract-counterparty"
              value={counterparty}
              onChange={(event) => setCounterparty(event.target.value)}
              placeholder="e.g. XYZ Corporation"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Value (optional)</Label>
              <Input
                type="number"
                value={value}
                onChange={(event) => setValue(event.target.valueAsNumber || "")}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Effective date (optional)</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expiry date (optional)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Renewal notice (days)</Label>
              <Input
                type="number"
                value={renewalNoticeDays}
                onChange={(event) => setRenewalNoticeDays(Number(event.target.value) || 30)}
                min="0"
                step="1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              id="contract-auto-renew"
              checked={autoRenew}
              onChange={(event) => setAutoRenew(event.target.checked)}
            />
            <Label htmlFor="contract-auto-renew" className="text-xs cursor-pointer">
              Auto-renew
            </Label>
          </div>

          <div className="space-y-1">
            <Label htmlFor="contract-content" className="text-xs">
              Content (optional)
            </Label>
            <Textarea
              id="contract-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Contract text (optional)"
              className="min-h-[100px]"
            />
          </div>
          {createContract.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Could not create contract: {createContract.error.message}
              </AlertDescription>
            </Alert>
          ) : null}
        </form>
        <SheetFooter className="border-t p-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            type="button"
            disabled={createContract.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-contract-form"
            disabled={
              createContract.isPending ||
              !title.trim() ||
              clientsQuery.isError
            }
            className="gap-2"
          >
            {createContract.isPending && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            Create contract
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}