"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Wand2, Eye } from 'lucide-react';

import { AILoadingState } from './ailoading-state';
import { AIErrorState } from './aierror-state';
import {
  Artifact,
  ArtifactActions,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import { AIDocumentActions } from "../../ai/ai-document-actions";

interface AIDocumentGeneratorProps {
  className?: string;
}

const DOCUMENT_TYPES = [
  { value: 'letter', label: 'Formal Letter' },
  { value: 'contract', label: 'Employment Contract' },
  { value: 'report', label: 'Performance Report' },
  { value: 'policy', label: 'Company Policy' },
  { value: 'memo', label: 'Internal Memo' },
  { value: 'proposal', label: 'Business Proposal' },
];

export function AIDocumentGenerator({ className }: AIDocumentGeneratorProps) {
  const [documentType, setDocumentType] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generatedDocument, setGeneratedDocument] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!documentType || !prompt.trim()) {
      setError('Please select a document type and provide a prompt.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Simulate AI generation - in real implementation, this would call an AI service
      const response = await fetch('/api/ai/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: documentType, prompt }),
      });

      if (!response.ok) throw new Error('Failed to generate document');

      const data = await response.json();
      setGeneratedDocument(data.document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Document Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="prompt">Document Requirements</Label>
            <Textarea
              id="prompt"
              placeholder="Describe what you want the document to include..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !documentType || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <AILoadingState />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Document
              </>
            )}
          </Button>

          {error && <AIErrorState message={error} />}


          {generatedDocument && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <Artifact>
                <ArtifactHeader>
                  <div className="flex min-w-0 items-start gap-2">
                    <ArtifactTitle className="truncate">
                      Generated Document
                    </ArtifactTitle>
                  </div>
                  <AIDocumentActions documentText={generatedDocument} />
                </ArtifactHeader>
                <ArtifactDescription>
                  Copy, download, or share your generated document.
                </ArtifactDescription>
                <ArtifactContent>
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {generatedDocument}
                  </pre>
                </ArtifactContent>
              </Artifact>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}