// components/matters/billing/matter-billing.tsx
"use client";

import * as React from "react";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatterInvoice } from "../types";
import { InvoiceCard } from "./invoice-card";

export interface MatterBillingProps {
  invoices: MatterInvoice[];
  outstanding: number;
  trustBalance?: number;
  currency?: string;
  onNewInvoice?: () => void;
  onSelect?: (invoice: MatterInvoice) => void;
  onDownload?: (invoice: MatterInvoice) => void;
}

export function MatterBilling({
  invoices,
  outstanding,
  trustBalance,
  currency = "RM",
  onNewInvoice,
  onSelect,
  onDownload,
}: MatterBillingProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-border/60 p-3">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-lg font-semibold tabular-nums">
            {currency} {outstanding.toLocaleString()}
          </p>
        </div>
        {typeof trustBalance === "number" ? (
          <div className="rounded-md border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Trust balance</p>
            <p className="text-lg font-semibold tabular-nums">
              {currency} {trustBalance.toLocaleString()}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{invoices.length} invoices</p>
        {onNewInvoice ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onNewInvoice}>
            <FilePlus2 className="size-3.5" /> New invoice
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices issued yet.</p>
        ) : (
          invoices.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} onSelect={onSelect} onDownload={onDownload} />
          ))
        )}
      </div>
    </div>
  );
}
