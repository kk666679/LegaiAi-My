"use client";

import { useEffect, useState } from "react";
import type { ValidationResult, CitationStatus } from "@/lib/lawmate/draft/types";

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

function toCitationStatus(s: CitationValidation["status"]): CitationStatus {
  switch (s) {
    case "valid": return "VERIFIED";
    case "overruled": return "CONFLICT";
    case "warning": return "UNVERIFIED";
    case "invalid": return "INVALID";
  }
}

export function CitationValidator({
  citations,
  onValidated,
}: CitationValidatorProps) {
  const [results, setResults] = useState<CitationValidation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (citations.length === 0) return;

    setLoading(true);
    const mockResults: CitationValidation[] = citations.map((citation) => ({
      citation,
      status: ["valid", "overruled", "warning", "valid"][
        Math.floor(Math.random() * 4)
      ] as CitationValidation["status"],
      message: "Mock validation",
    }));

    setTimeout(() => {
      setResults(mockResults);
      setLoading(false);

      onValidated({
        ok: mockResults.every((r) => r.status === "valid"),
        score:
          mockResults.length === 0
            ? 1
            : mockResults.filter((r) => r.status === "valid").length /
              mockResults.length,
        citations: mockResults.map((r, i) => ({
          id: `citation-${i}`,
          displayText: r.citation,
          status: toCitationStatus(r.status),
          explanation: r.message,
        })),
        issues: mockResults
          .filter((r) => r.status === "overruled" || r.status === "invalid")
          .map((r) => ({
            severity: "error" as const,
            message: r.message ?? `${r.citation} is ${r.status}`,
          })),
        hasOverruled: mockResults.some((r) => r.status === "overruled"),
        summary: {
          total: mockResults.length,
          valid: mockResults.filter((r) => r.status === "valid").length,
          overruled: mockResults.filter((r) => r.status === "overruled").length,
          warning: mockResults.filter((r) => r.status === "warning").length,
        },
      });
    }, 500);
  }, [citations, onValidated]);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Validating {citations.length} citation(s)…
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="space-y-2">
      {results.map((r, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-md border p-2 text-sm"
        >
          <span className="font-mono">{r.citation}</span>
          <span
            className={
              r.status === "valid"
                ? "text-green-600"
                : r.status === "overruled"
                ? "text-red-600"
                : "text-yellow-600"
            }
          >
            {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}
