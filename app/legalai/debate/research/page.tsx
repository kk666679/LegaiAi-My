"use client";

import * as React from "react";
import { BookOpen, Search } from "lucide-react";
import { trpcReact } from "@/clients";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

export default function ResearchPage() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const searchMutation = trpcReact.agents.retrieve.useMutation();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await searchMutation.mutateAsync({
        query: query.trim(),
        filters: {},
        topK: 10,
      });
      setResults([]);
    } catch (err: any) {
      setError(err.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Legal Research"
          description="Retrieve and analyse Malaysian legal sources with AI-assisted reasoning."
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-4" /> Search Legal Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Malaysian law, cases, statutes..."
                className="flex-1"
                aria-label="Search query"
              />
              <Button type="submit" disabled={loading || !query.trim()} className="gap-2">
                {loading ? "Searching..." : <><Search className="size-4" /> Search</>}
              </Button>
            </form>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {results.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {results.map((r, idx) => (
                    <div key={idx} className="p-4 rounded-md border bg-card/40">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{r.title ?? r.citation ?? `Result ${idx + 1}`}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {r.citation && <Badge variant="secondary" className="text-xs mr-2">{r.citation}</Badge>}
                            {r.court && <Badge variant="outline" className="text-xs">{r.court}</Badge>}
                          </p>
                        </div>
                        {r.score !== undefined && (
                          <Badge variant="outline" className="text-xs">{Math.round(r.score * 100)}%</Badge>
                        )}
                      </div>
                      {r.excerpt && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{r.excerpt}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <EmptyState
                icon={BookOpen}
                title="Search Malaysian law"
                description="Enter a query to search case law, statutes, and legal documents."
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}