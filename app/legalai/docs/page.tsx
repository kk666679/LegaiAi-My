'use client';

import { BRAND } from '@/lib/brand';
import { useMemo, useState } from 'react';
import {
  BookOpen,
  FileCode2,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { AgentCard } from '@/components/legalai/shared/agent-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type DocCategory =
  | 'api'
  | 'templates'
  | 'compliance'
  | 'workflow';

type DocItem = {
  id: string;
  title: string;
  category: DocCategory;
  version: string;
  updatedAt: string;
  desc: string;
  tags: string[];
};

const docs: DocItem[] = [
  {
    id: 'agent-api',
    title: 'OpenClaw Agent API',
    category: 'api',
    version: 'v2.4.0',
    updatedAt: '2026-05-27',
    desc:
      'Agent orchestration contracts, execution payloads, streaming events, and worker lifecycle integration.',
    tags: ['agents', 'jobs', 'sdk', 'pipeline'],
  },

  {
    id: 'drafting-templates',
    title: 'Malaysian Drafting Templates',
    category: 'templates',
    version: 'v1.9.2',
    updatedAt: '2026-05-20',
    desc:
      'Legal pleading templates, affidavit structures, demand letters, and litigation drafting schema.',
    tags: ['pleadings', 'templates', 'litigation'],
  },

  {
    id: 'citation-policy',
    title: 'MLJ Citation Policy',
    category: 'compliance',
    version: 'v1.2.1',
    updatedAt: '2026-05-22',
    desc:
      'Citation formatting standards, verification rules, authority ranking, and hallucination prevention workflows.',
    tags: ['citations', 'verification', 'MLJ'],
  },

  {
    id: 'workflow-engine',
    title: 'Workflow Orchestration Engine',
    category: 'workflow',
    version: 'v3.0.0',
    updatedAt: '2026-05-27',
    desc:
      'Multi-agent workflow execution, retries, observability, event pipelines, and execution tracing.',
    tags: ['workflow', 'telemetry', 'agents'],
  },
];

const categoryConfig: Record<
  DocCategory,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
  }
> = {
  api: {
    label: 'API',
    icon: <FileCode2 className="h-4 w-4" />,
    color: 'bg-blue-500/10 text-blue-600',
  },

  templates: {
    label: 'Templates',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-purple-500/10 text-purple-600',
  },

  compliance: {
    label: 'Compliance',
    icon: <ShieldCheck className="h-4 w-4" />,
    color: 'bg-emerald-500/10 text-emerald-600',
  },

  workflow: {
    label: 'Workflow',
    icon: <Workflow className="h-4 w-4" />,
    color: 'bg-orange-500/10 text-orange-600',
  },
};

export default function DocsPage() {
  const [query, setQuery] = useState('');

  const filteredDocs = useMemo(() => {
    const q = query.toLowerCase();

    return docs.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.desc.toLowerCase().includes(q) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="flex h-full bg-muted/20">
      {/* Main */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {BRAND.name} Documentation
                  </h1>

                  <p className="text-sm text-muted-foreground">
                    Internal platform specifications, orchestration guides,
                    legal drafting standards, and compliance references.
                  </p>
                </div>
              </div>
            </div>

            <Badge className="rounded-full px-3 py-1">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Internal Docs
            </Badge>
          </div>

          {/* Agent Card */}
          <AgentCard
            name={`${BRAND.name} Docs`}
            model="Documentation Engine"
            jurisdiction="Malaysia"
            tools={[
              'docs',
              'workflow',
              'templates',
              'compliance',
            ]}
          />

          {/* Search */}
          <Card className="mt-6 border shadow-sm">
            <div className="p-5">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documentation, APIs, templates, workflows..."
                  className="pl-10"
                />
              </div>
            </div>
          </Card>

          {/* Docs Grid */}
          <div className="mt-6">
            <ScrollArea className="h-[700px] pr-4">
              <div className="grid gap-4">
                {filteredDocs.length === 0 ? (
                  <Card className="border p-10 text-center shadow-sm">
                    <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />

                    <h3 className="font-semibold">
                      No documents found
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Try searching with different keywords.
                    </p>
                  </Card>
                ) : (
                  filteredDocs.map((doc) => {
                    const category = categoryConfig[doc.category];

                    return (
                      <Card
                        key={doc.id}
                        className="border transition-all hover:border-primary/30 hover:shadow-md"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`rounded-xl p-2 ${category.color}`}
                              >
                                {category.icon}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-semibold">
                                    {doc.title}
                                  </h3>

                                  <Badge variant="secondary">
                                    {doc.version}
                                  </Badge>
                                </div>

                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                  {doc.desc}
                                </p>
                              </div>
                            </div>

                            <Badge
                              variant="outline"
                              className="whitespace-nowrap"
                            >
                              {category.label}
                            </Badge>
                          </div>

                          <Separator className="my-4" />

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-2">
                              {doc.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="rounded-full"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>

                            <p className="text-xs text-muted-foreground">
                              Updated {doc.updatedAt}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden w-[340px] border-l bg-background xl:block">
        <div className="sticky top-0 p-5">
          <Card className="border shadow-sm">
            <div className="space-y-5 p-5">
              <div>
                <h3 className="font-semibold">
                  Documentation Status
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Internal platform documentation and governance overview.
                </p>
              </div>

              <Separator />

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Total Documents
                  </span>

                  <Badge variant="secondary">
                    {docs.length}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    API Coverage
                  </span>

                  <Badge className="bg-emerald-600 hover:bg-emerald-600">
                    Complete
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Citation Policies
                  </span>

                  <Badge className="bg-emerald-600 hover:bg-emerald-600">
                    Verified
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Workflow Engine
                  </span>

                  <Badge variant="secondary">
                    v3.0.0
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs leading-6 text-muted-foreground">
                  Documentation can be connected to:
                </p>

                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• OpenAPI specifications</li>
                  <li>• Vector document search</li>
                  <li>• MDX knowledge bases</li>
                  <li>• Workflow telemetry traces</li>
                  <li>• Legal template registries</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}