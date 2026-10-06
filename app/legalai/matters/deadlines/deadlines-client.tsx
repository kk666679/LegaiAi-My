"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MatterDeadlines, type MatterDeadline } from "@/components/matters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AllDeadlinesPage() {
  const [deadlines, setDeadlines] = React.useState<MatterDeadline[]>([]);
  React.useEffect(() => { /* GET /api/deadlines */ }, []);

  const upcoming = deadlines.filter((d) => !d.completed);
  const past = deadlines.filter((d) => d.completed);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div><h1 className="text-lg font-semibold">Deadlines</h1><p className="text-xs text-muted-foreground">Every deadline across matters.</p></div>
          <Button size="sm" className="gap-1.5"><Plus className="size-3.5" />Add deadline</Button>
        </div>
      </header>
      <Tabs defaultValue="upcoming" className="p-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-3"><MatterDeadlines deadlines={upcoming} /></TabsContent>
        <TabsContent value="completed" className="mt-3"><MatterDeadlines deadlines={past} /></TabsContent>
      </Tabs>
    </div>
  );
}
