"use client";

import { 
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader, 
  ChainOfThoughtStep 
} from "@/components/ai-elements/chain-of-thought";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ClipboardList,
  FileCheck,
  CheckCircle, 
  AlertTriangle
} from "lucide-react";
import type { ValidationResult } from "@/lib/lawmate/draft/types";

interface DraftWorkflowProps {
  currentStep: number;
  validationResult?: ValidationResult;
  jobId?: string;
}

export function DraftWorkflow({ currentStep, validationResult, jobId }: DraftWorkflowProps) {
  const steps = [
    {
      number: 1,
      title: "Collect Information",
      description: "Gather required fields and document details",
      icon: ClipboardList,
      tool: "field_collector",
    },
    {
      number: 2,
      title: "Validate Citations",
      description: "Check MLJ citations for overruled cases",
      icon: CheckCircle,
      tool: "legal_validate",
    },
    {
      number: 3,
      title: "Generate Document",
      description: "Draft document with standard template",
      icon: FileCheck,
      tool: "legal_draft",
    },
  ];

  return (
    <div className="space-y-4">
      <ChainOfThought defaultOpen>
        <ChainOfThoughtHeader>Drafting Workflow</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          {steps.map((step) => {
            const isActive = currentStep === step.number;
            const isComplete = currentStep > step.number;
            const status = isActive ? "active" : isComplete ? "complete" : "pending";
            
            return (
              <ChainOfThoughtStep
                key={step.number}
                icon={step.icon}
                label={
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{step.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {step.tool}
                    </Badge>
                  </div>
                }
                description={step.description}
                status={status}
              >
                {step.number === 2 && validationResult && (
                  <div className="mt-2 text-xs">
                    <div className={validationResult.hasOverruled ? "text-red-600" : "text-green-600"}>
                      {validationResult.hasOverruled 
                        ? `⚠️ ${validationResult.summary?.overruled ?? 0} overruled citation(s)`
                        : `✅ ${validationResult.summary?.valid ?? 0} valid citation(s)`
                      }
                    </div>
                  </div>
                )}
                
                {step.number === 3 && jobId && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Job ID: {jobId}
                    </Badge>
                  </div>
                )}
              </ChainOfThoughtStep>
            );
          })}
        </ChainOfThoughtContent>
      </ChainOfThought>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Rules Applied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="size-4 text-green-500 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium">Validate before draft</span>
              <p className="text-muted-foreground text-xs">
                Citations validated before document generation
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-4 text-yellow-500 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium">Block overruled citations</span>
              <p className="text-muted-foreground text-xs">
                Cannot draft with red-tier (overruled) citations
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <FileCheck className="size-4 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium">MLJ format required</span>
              <p className="text-muted-foreground text-xs">
                All citations must be in [YYYY] N MLJ NNN format
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {jobId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Document Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Job ID</span>
              <Badge variant="outline" className="font-mono">{jobId}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className="bg-green-100 text-green-700">Queued</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Template</span>
              <span className="text-sm">Standard Court Document</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertTriangle className="size-4" />
        <AlertDescription className="text-xs">
          Document requires lawyer review and signature before filing.
        </AlertDescription>
      </Alert>
    </div>
  );
}

