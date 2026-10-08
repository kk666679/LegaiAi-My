'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactContent, ArtifactActions, ArtifactAction } from '@/components/ai-elements/artifact';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from '@/lib/utils';

interface ArtifactCardProps {
  title: string;
  version?: number;
  status?: 'draft' | 'validated' | 'approved' | 'submitted';
  content: string;
  evidenceCount?: number;
  className?: string;
  onEdit?: () => void;
  onSubmit?: () => void;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  validated: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  submitted: 'bg-purple-100 text-purple-700',
};

export function ArtifactCard({ title, version = 1, status = 'draft', content, evidenceCount, className, onEdit, onSubmit }: ArtifactCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Artifact className={className}>
      <ArtifactHeader>
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <ArtifactTitle>{title}</ArtifactTitle>
          <Badge variant="outline" className="text-[10px]">v{version}</Badge>
          <Badge className={cn('text-[10px]', statusColors[status])} variant="secondary">{status}</Badge>
          {evidenceCount !== undefined && (
            <Badge variant="outline" className="text-[10px]">{evidenceCount} sources</Badge>
          )}
        </div>
        <ArtifactActions>
          <ArtifactAction tooltip="Copy" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </ArtifactAction>
          <ArtifactAction tooltip="Download" onClick={() => {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="size-4" />
          </ArtifactAction>
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent>
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">{content}</pre>
      </ArtifactContent>
    </Artifact>
  );
}
