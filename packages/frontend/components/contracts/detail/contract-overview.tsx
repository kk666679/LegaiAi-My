"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Contract } from "../types";

export function ContractOverview({ contract, aiSummary }: { contract: Contract; aiSummary?: string }) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">AI summary</p>
        <p className="text-sm leading-relaxed">{aiSummary ?? contract.aiSummary ?? "Run analysis to generate a summary."}</p>
      </Card>
      <Card className="p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Key facts</p>
        <dl className="space-y-1.5 text-sm">
          <Row label="Type" value={<span className="capitalize">{contract.type.replace("-", " ")}</span>} />
          {contract.governingLaw ? <Row label="Governing law" value={contract.governingLaw} /> : null}
          {contract.jurisdiction ? <Row label="Jurisdiction" value={contract.jurisdiction} /> : null}
          {contract.renewalType ? <Row label="Renewal" value={<span className="capitalize">{contract.renewalType.replace("-", " ")}</span>} /> : null}
          {contract.matterName ? <Row label="Matter" value={contract.matterName} /> : null}
          {contract.ownerName ? <Row label="Owner" value={contract.ownerName} /> : null}
          {contract.documentName ? <Row label="Document" value={contract.documentName} /> : null}
        </dl>
        {contract.tags?.length ? <div className="mt-3 flex flex-wrap gap-1">{contract.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div> : null}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="text-right">{value}</dd></div>;
}
