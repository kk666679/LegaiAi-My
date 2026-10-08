"use client";
import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TemplateCategory({ categories, value, onChange }: { categories: string[]; value?: string; onChange?: (c: string) => void }) {
  return (
    <Tabs value={value ?? categories[0]} onValueChange={onChange}>
      <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
        {categories.map((c) => <TabsTrigger key={c} value={c} className="rounded-full border border-border/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{c}</TabsTrigger>)}
      </TabsList>
    </Tabs>
  );
}
