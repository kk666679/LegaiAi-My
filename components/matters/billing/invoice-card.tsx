// components/matters/billing/invoice-card.tsx
"use client";

import * as React from "react";
import { Download, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MatterInvoice } from "../types";

const STATUS_TONE: Record<MatterInvoice["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  overdue: "bg-destructive/10 text-destructive",
  void: "bg-muted text-muted-foreground line-through",
};

export interface InvoiceCardProps {
  invoice: MatterInvoice;
  onDownload?: (invoice: MatterInvoice) => void;
  onSelect?: (invoice: MatterInvoice) => void;
}

export function InvoiceCard({ invoice, onDownload, onSelect }: InvoiceCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(invoice)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect?.(invoice);
      }}
      className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:border-primary/40"
    >
      <div className="rounded-md bg-muted p-2 text-muted-foreground">
        <FileText className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{invoice.number}</p>
        <p className="text-xs text-muted-foreground">
          Issued {new Date(invoice.issuedAt).toLocaleDateString()}
          {invoice.dueAt ? ` · Due ${new Date(invoice.dueAt).toLocaleDateString()}` : ""}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium tabular-nums">
          {invoice.currency ?? "RM"} {invoice.total.toLocaleString()}
        </p>
        <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium", STATUS_TONE[invoice.status])}>
          {invoice.status}
        </Badge>
      </div>
      {onDownload ? (
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-muted-foreground"
          aria-label={`Download invoice ${invoice.number}`}
          onClick={(e) => {
            e.stopPropagation();
            onDownload(invoice);
          }}
        >
          <Download className="size-3.5" />
        </Button>
      ) : null}
    </Card>
  );
}
