// components/matters/tasks/matter-tasks.tsx
"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MatterTask } from "../types";
import { TaskCard } from "./task-card";

export interface MatterTasksProps {
  tasks: MatterTask[];
  onAdd?: () => void;
  onToggle?: (task: MatterTask) => void;
  onSelect?: (task: MatterTask) => void;
}

export function MatterTasks({ tasks, onAdd, onToggle, onSelect }: MatterTasksProps) {
  const open = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const done = tasks.filter((t) => t.status === "done" || t.status === "cancelled");

  return (
    <Tabs defaultValue="open">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="done">Done ({done.length})</TabsTrigger>
        </TabsList>
        {onAdd ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onAdd}>
            <Plus className="size-3.5" /> Add task
          </Button>
        ) : null}
      </div>
      <TabsContent value="open" className="mt-3 space-y-2">
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open tasks.</p>
        ) : (
          open.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggle} onSelect={onSelect} />)
        )}
      </TabsContent>
      <TabsContent value="done" className="mt-3 space-y-2">
        {done.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing completed yet.</p>
        ) : (
          done.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggle} onSelect={onSelect} />)
        )}
      </TabsContent>
    </Tabs>
  );
}
