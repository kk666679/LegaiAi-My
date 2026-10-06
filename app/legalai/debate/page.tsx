"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Swords, Plus, Search } from "lucide-react";
import Link from "next/link";
import { trpcReact } from "@/clients";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { DebateDialog } from "@/components/lawmate/DebateDialog";
import { formatDate } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";

export default function DebatePage() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);

  const { data, isLoading, isError, error, refetch } = trpcReact.debate.list.useQuery({ limit: 20 });
  const [search, setSearch] = React.useState("");

  const debates = data ?? [];

  const filtered = debates.filter((d: any) =>
    !search || d.problem.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data: { problem: string; citations: string[]; rounds: number }) => {
    try {
      const result = await trpcReact.debate.start.mutateAsync(data);
      router.push(`/legalai/debate/${result.jobId}`);
    } catch (err) {
      console.error("Failed to start debate:", err);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Debate & Research"
          description="Multi-agent legal debate and research simulation."
          actions={
            <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
              <Plus className="size-3.5" /> New debate
            </Button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="size-4" /> Start a Debate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Run a multi-agent adversarial simulation with Plaintiff, Defendant, and Adjudicator roles.
              </p>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href="/legalai/debate"><Swords className="size-4" /> Open Debate</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="size-4" /> Legal Research
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Retrieve and analyse Malaysian legal sources with AI-assisted reasoning.
              </p>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href="/legalai/debate/research"><Search className="size-4" /> Open Research</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Recent Debates</CardTitle>
              </div>
              <Input
                placeholder="Search debates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[280px]"
                aria-label="Search debates"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Problem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[300px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : isError ? (
              <div className="text-center py-8 text-destructive">
                <p>Failed to load debates: {error?.message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Retry</Button>
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Swords}
                title="No debates yet"
                description="Start a new debate to see AI agents argue both sides of a legal question."
                action="New debate"
                actionHref="/legalai/debate"
              />
            ) : (
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[400px]">Problem</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[150px]">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((d: any) => (
                      <TableRow key={d.id} className="cursor-pointer hover:bg-accent/40" onClick={() => router.push(`/legalai/debate/${d.id}`)}>
                        <TableCell className="font-medium">
                          <div className="truncate">{d.problem}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{d.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(d.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <DebateDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
      </div>
    </DashboardShell>
  );
}