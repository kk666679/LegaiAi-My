"use client";

import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpcReact } from "@/clients";

type SavedAuthorityRow = { sourceId: string; authority: unknown; createdAt: string | Date };

export function SavedAuthoritiesPage() {
  const saved = trpcReact.research.savedAuthorities.useQuery();
  const remove = trpcReact.research.removeSavedAuthority.useMutation();
  const utils = trpcReact.useUtils();
  const items = (saved.data ?? []) as SavedAuthorityRow[];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 p-4 lg:p-6">
      <header>
        <h1 className="text-xl font-semibold">Saved authorities</h1>
        <p className="mt-1 text-sm text-muted-foreground">Authorities you saved from research sessions.</p>
      </header>
      {saved.isLoading ? <p className="text-sm text-muted-foreground">Loading saved authorities…</p> : null}
      {saved.isError ? <p role="alert" className="text-sm text-destructive">Could not load saved authorities.</p> : null}
      {!saved.isLoading && !saved.isError && items.length === 0 ? (
        <Card className="p-8 text-center">
          <Bookmark className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No saved authorities</p>
          <p className="mt-1 text-xs text-muted-foreground">Save an authority from research results to find it here.</p>
          <Button asChild size="sm" variant="outline" className="mt-4"><Link href="/lawmate/research">Go to research</Link></Button>
        </Card>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item: SavedAuthorityRow) => {
          const authority = item.authority as { title?: string; citation?: { full?: string; short?: string }; summary?: string; sessionId?: string };
          const href = authority.sessionId
            ? `/lawmate/research/${encodeURIComponent(authority.sessionId)}/authorities/${encodeURIComponent(item.sourceId)}`
            : undefined;
          return (
            <Card key={item.sourceId} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {href ? <Link href={href} className="font-medium hover:underline">{authority.title ?? item.sourceId}</Link> : <p className="font-medium">{authority.title ?? item.sourceId}</p>}
                  {authority.citation?.full || authority.citation?.short ? <p className="mt-1 text-xs text-muted-foreground">{authority.citation.full ?? authority.citation.short}</p> : null}
                </div>
                <Button size="icon" variant="ghost" aria-label={`Remove ${authority.title ?? "authority"}`} disabled={remove.isPending} onClick={() => remove.mutate({ sourceId: item.sourceId }, {
                  onSuccess: async () => { await utils.research.savedAuthorities.invalidate(); toast.success("Authority removed"); },
                  onError: (error: Error) => toast.error(error.message),
                })}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              {authority.summary ? <p className="line-clamp-3 text-sm text-muted-foreground">{authority.summary}</p> : null}
              <p className="text-[11px] text-muted-foreground">Saved {new Date(item.createdAt).toLocaleDateString()}</p>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
