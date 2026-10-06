"use client";
import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

export function MobileContractActions({ children }: { children: React.ReactNode }) {
  return (
    <Drawer>
      <DrawerTrigger asChild><Button size="icon" variant="ghost" className="size-9" aria-label="More actions"><MoreHorizontal className="size-4" /></Button></DrawerTrigger>
      <DrawerContent><div className="space-y-2 p-4">{children}</div></DrawerContent>
    </Drawer>
  );
}
