"use client";
// app/lawmate/research/_components/research-new.tsx
import * as React from "react";
import { ResearchHomePage } from "./research-home";

/** `/new` uses the same UI as the root — the router handles the split. */
export function ResearchNewPage() {
  return <ResearchHomePage />;
}
