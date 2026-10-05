"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  Copy, 
  FileText, 
  Eye, 
  Code, 
  AlertTriangle,
  CheckCircle 
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DocumentPreviewProps {
  document?: string;
  jobId?: string;
  format: "markdown" | "docx" | "pdf";
}

export function DocumentPreview({ document, jobId, format }: DocumentPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!document) return;
    await navigator.clipboard.writeText(document);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!document) return;
    
    const blob = new Blob([document], { 
      type: format === "markdown" ? "text/markdown" : "application/octet-stream"
    });
    const url = URL.createObjectURL(blob);
    if (typeof window === "undefined") return;
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `draft-${jobId || "document"}.${format}`;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (!document) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="size-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No document generated yet</p>
        </CardContent>
      </Card>
    );
  }

  const mockDocument = `# IN THE HIGH COURT OF MALAYA AT KUALA LUMPUR
## CIVIL SUIT NO: WA-22NCC-123-2024

**BETWEEN**

ABC SDN BHD (Company No. 123456-A) ... PLAINTIFF

**AND**

XYZ CORPORATION SDN BHD (Company No. 789012-B) ... DEFENDANT

---

**WRIT OF SUMMONS**

To: XYZ Corporation Sdn Bhd  
Registered Address: Level 10, Menara XYZ, Jalan Ampang, 50450 Kuala Lumpur

**TAKE NOTICE** that this Writ of Summons has been issued against you by the above-named Plaintiff in respect of the claim set out in the Statement of Claim served herewith.

1. You have **14 days** from the date of service of this Writ to enter an appearance.

2. If you fail to enter an appearance within the prescribed time, the Plaintiff may proceed to obtain judgment against you in your absence.

**Legal Authority**

The Plaintiff relies on the following authorities:

- **Federal Agricultural Marketing Authority v Malayan Banking Berhad [2020] 3 MLJ 100**

**ETHICS NOTICE**

⚠️ This is an AI-generated document draft. It requires review, amendment, and signature by a qualified Malaysian lawyer before use in any legal proceeding. This document does not constitute legal advice.`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-5" />
          <span className="font-medium">Generated Document</span>
          {jobId && <Badge variant="outline">Job: {jobId}</Badge>}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <CheckCircle className="size-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4 mr-2" />
                Copy
              </>
            )}
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="size-4 mr-2" />
            Download {format.toUpperCase()}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">
            <Eye className="size-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="source">
            <Code className="size-4 mr-2" />
            Source
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardContent className="prose prose-sm max-w-none p-6">
              <ReactMarkdown>{document || mockDocument}</ReactMarkdown>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="source" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <pre className="bg-muted p-4 rounded-md font-mono text-sm overflow-auto max-h-96">
                {document || mockDocument}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert>
        <AlertTriangle className="size-4" />
        <AlertDescription>
          <span className="font-medium">Review Required:</span> This draft must be reviewed 
          and signed by a qualified Malaysian lawyer before filing or service.
        </AlertDescription>
      </Alert>
    </div>
  );
}

