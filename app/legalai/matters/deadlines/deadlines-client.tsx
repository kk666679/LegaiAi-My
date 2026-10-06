"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { trpcReact, type RouterOutputs } from "@/clients";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MatterDeadlines, type MatterDeadline } from "@/components/matters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MatterListPage = RouterOutputs["matters"]["list"];
type MatterRecord = MatterListPage["matters"][number];

export function AllDeadlinesPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [matterId, setMatterId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const mattersQuery = trpcReact.matters.list.useInfiniteQuery(
    { limit: 100 },
    { getNextPageParam: (lastPage: MatterListPage) => lastPage.nextCursor },
  );
  const addEvent = trpcReact.matters.addEvent.useMutation();
  const updateMatter = trpcReact.matters.update.useMutation();
  const utils = trpcReact.useUtils();

  React.useEffect(() => {
    if (mattersQuery.hasNextPage && !mattersQuery.isFetchingNextPage) {
      void mattersQuery.fetchNextPage();
    }
  }, [mattersQuery.fetchNextPage, mattersQuery.hasNextPage, mattersQuery.isFetchingNextPage]);

  const pages = mattersQuery.data?.pages as MatterListPage[] | undefined;
  const matters: MatterRecord[] = pages?.flatMap((page) => page.matters) ?? [];
  const deadlines: MatterDeadline[] = matters.flatMap((matter) => {
    if (!matter.deadlineAt) return [];
    return [{
      id: matter.id,
      matterId: matter.id,
      title: `Deadline · ${matter.matterNumber} · ${matter.title}`,
      kind: "deadline",
      dueAt: new Date(matter.deadlineAt).toISOString(),
      completed: false,
    }];
  });
  const selectedMatter = matters.find((matter: MatterRecord) => matter.id === matterId);
  const isSaving = addEvent.isPending || updateMatter.isPending;

  const resetForm = () => {
    setMatterId("");
    setTitle("");
    setDescription("");
    setDueDate("");
  };

  const submitDeadline = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!matterId || !title.trim() || !dueDate || isSaving) return;

    const eventDate = new Date(`${dueDate}T09:00:00`).toISOString();
    try {
      await addEvent.mutateAsync({
        matterId,
        eventType: "DEADLINE",
        title: title.trim(),
        description: description.trim() || undefined,
        eventDate,
      });
    } catch (error) {
      toast.error("Could not add deadline", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
      return;
    }

    try {
      await updateMatter.mutateAsync({ id: matterId, deadlineAt: eventDate });
    } catch (error) {
      toast.error("Deadline event created, but the matter deadline date could not be updated", {
        description: error instanceof Error ? error.message : "Refresh the matter and try again.",
      });
      setDialogOpen(false);
      resetForm();
      void Promise.all([
        utils.matters.list.invalidate(),
        utils.matters.getTimeline.invalidate({ matterId }),
      ]).catch((refreshError: unknown) => {
        toast.error("Matter deadline data could not refresh", {
          description: refreshError instanceof Error ? refreshError.message : "Refresh the page to see the latest data.",
        });
      });
      return;
    }

    setDialogOpen(false);
    resetForm();
    toast.success("Deadline added");
    try {
      await Promise.all([
        utils.matters.list.invalidate(),
        utils.matters.getTimeline.invalidate({ matterId }),
      ]);
    } catch (error) {
      toast.error("Deadline added, but matter deadline data could not refresh", {
        description: error instanceof Error ? error.message : "Refresh the page to see it.",
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Deadlines</h1>
            <p className="text-xs text-muted-foreground">
              Current matter deadline dates. Event history and completion status are not available in this view.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <Plus className="size-3.5" /> Add deadline
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a matter deadline</DialogTitle>
                <DialogDescription>
                  Add a deadline event and set the matter&apos;s current deadline date.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submitDeadline} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline-matter">Matter</Label>
                  <Select value={matterId} onValueChange={setMatterId}>
                    <SelectTrigger id="deadline-matter">
                      <SelectValue placeholder={mattersQuery.isLoading ? "Loading matters…" : "Select a matter"} />
                    </SelectTrigger>
                    <SelectContent>
                      {matters.map((matter: MatterRecord) => (
                        <SelectItem key={matter.id} value={matter.id}>
                          {matter.matterNumber} · {matter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mattersQuery.isError ? (
                    <p role="alert" className="text-sm text-destructive">
                      Could not load matters: {mattersQuery.error.message}
                    </p>
                  ) : null}
                  {selectedMatter?.deadlineAt ? (
                    <p className="text-xs text-muted-foreground">
                      Current deadline: {new Date(selectedMatter.deadlineAt).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline-title">Deadline title</Label>
                  <Input
                    id="deadline-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    maxLength={500}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline-date">Due date</Label>
                  <Input
                    id="deadline-date"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline-description">Notes (optional)</Label>
                  <Textarea
                    id="deadline-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving || !matterId || !title.trim() || !dueDate || mattersQuery.isError}>
                    {isSaving ? "Saving…" : "Add deadline"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {mattersQuery.isError ? (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Could not load matter deadline dates: {mattersQuery.error.message}
          </p>
        ) : null}
      </header>
      <Tabs defaultValue="upcoming" className="p-4">
        <TabsList>
          <TabsTrigger value="upcoming">Open ({deadlines.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed (unavailable)</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-3">
          {mattersQuery.isLoading || mattersQuery.isFetchingNextPage ? (
            <p className="text-sm text-muted-foreground">Loading matter deadline dates…</p>
          ) : (
            <MatterDeadlines deadlines={deadlines} />
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-3">
          <p className="text-sm text-muted-foreground">
            Completion status is not stored on matter deadline dates, so completed deadlines cannot be listed here.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
