"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Shield,
} from "lucide-react";
import { 
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader, 
  ChainOfThoughtStep 
} from "@/components/ai-elements/chain-of-thought";

import type { ValidationResult } from '@/lib/lawmate/draft/types';


interface CitationValidation {
  citation: string;
  status: "valid" | "overruled" | "warning" | "invalid";
  message?: string;
  caseName?: string;
  year?: number;
}

interface CitationValidatorProps {
  citations: string[];
  onValidated: (result: ValidationResult) => boolean;
}

export function CitationValidator({ 
  citations, 
  onValidated
}: CitationValidatorProps) {
  const [results, setResults] = useState<CitationValidation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (citations.length === 0) return;

    // Mock API call to tRPC ai.validateCitation
    setLoading(true);
    const mockResults: CitationValidation[] = citations.map(citation => ({
      citation,
      status: (['valid', 'overruled', 'warning', 'valid'][Math.floor(Math.random() * 4)]) as CitationValidation['status'],
      message: 'Mock validation',
    }));
    setTimeout(() => {
      setResults(mockResults);
      setLoading(false);
      onValidated({
        valid: mockResults.every(r => r.status === 'valid'),
        hasOverruled: mockResults.some(r => r.status === 'overruled'),
        citations: mockResults.map(r => ({
          citation: r.citation,
          status: r.status,
          message: r.message,
          caseName: r.caseName,
          year: r.year,
        })),
        summary: {
          total: mockResults.length,
          valid: mockResults.filter(r => r.status === 'valid').length,
          overruled: mockResults.filter(r => r.status === 'overruled').length,
          warning: mockResults.filter(r => r.status === 'warning').length,
        },
      });

    }, 1000);
  }, [citations, onValidated]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Citation Validation</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Citation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, idx) => (
                <TableRow key={idx}>
                  <TableCell>{result.citation}</TableCell>
                  <TableCell>
                    <Badge variant={result.status === 'valid' ? 'default' : result.status === 'warning' ? 'secondary' : 'destructive'}>
                      {result.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{result.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
