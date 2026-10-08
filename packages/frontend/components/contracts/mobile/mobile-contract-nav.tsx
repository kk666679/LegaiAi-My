"use client";
import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ContractsNavigation } from "../core/contracts-navigation";

export function MobileContractNav() {
  return (
    <Sheet>
      <SheetTrigger asChild><Button size="icon" variant="outline" className="size-9 md:hidden" aria-label="Menu"><Menu className="size-4" /></Button></SheetTrigger>
      <SheetContent side="left" className="w-72 p-0"><ContractsNavigation /></SheetContent>
    </Sheet>
  );
}
