"use client";
import * as React from "react";
import { FileSignature, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ContractTemplate } from "../types";

export function ContractTemplateCard({ template, onUse, onPreview, onFavoriteChange }: { template: ContractTemplate; onUse?: (t: ContractTemplate) => void; onPreview?: (t: ContractTemplate) => void; onFavoriteChange?: (t: ContractTemplate, next: boolean) => void }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground"><FileSignature className="size-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{template.name}</p>
            {onFavoriteChange ? (
              <Button size="icon" variant="ghost" className="size-5" aria-label="Favorite" onClick={() => onFavoriteChange(template, !template.favourite)}>
                <Star className={template.favourite ? "size-3 fill-amber-400 text-amber-400" : "size-3"} />
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground capitalize">{template.contractType.replace("-", " ")}{template.jurisdiction ? ` · ${template.jurisdiction}` : ""}</p>
        </div>
      </div>
      {template.description ? <p className="line-clamp-2 text-xs text-muted-foreground">{template.description}</p> : null}
      <div className="flex flex-wrap items-center gap-1.5">
        {typeof template.clauseCount === "number" ? <Badge variant="secondary" className="text-[10px]">{template.clauseCount} clauses</Badge> : null}
        {template.tags?.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
      </div>
      <div className="mt-auto flex gap-2">
        {onPreview ? <Button size="sm" variant="outline" onClick={() => onPreview(template)}>Preview</Button> : null}
        <Button size="sm" onClick={() => onUse?.(template)}>Use template</Button>
      </div>
    </Card>
  );
}
