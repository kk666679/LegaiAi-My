"use client";
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WorkflowMeta, WorkflowStats } from "../types";
import { Badge } from "@/components/ui/badge";

export interface AutomationTableProps {
  workflows: WorkflowMeta[];
  statsById?: Record<string, WorkflowStats>;
  onOpen?: (w: WorkflowMeta) => void;
}

export function AutomationTable({ workflows, statsById, onOpen }: AutomationTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Runs</TableHead>
          <TableHead>Success</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workflows.map((w) => {
          const stats = statsById?.[w.id];
          return (
            <TableRow key={w.id} className="cursor-pointer" onClick={() => onOpen?.(w)}>
              <TableCell className="max-w-[280px] truncate font-medium">{w.name}</TableCell>
              <TableCell><Badge variant="outline" className="text-[10px] capitalize">{w.status}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{w.category ?? "—"}</TableCell>
              <TableCell className="tabular-nums text-muted-foreground">{stats?.totalRuns ?? 0}</TableCell>
              <TableCell className="tabular-nums text-muted-foreground">{stats ? `${stats.successRate.toFixed(0)}%` : "—"}</TableCell>
              <TableCell className="text-muted-foreground">{new Date(w.updatedAt).toLocaleDateString()}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
