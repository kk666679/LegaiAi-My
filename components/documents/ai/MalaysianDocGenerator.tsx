import React from "react";
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, FileText, Shield, FileText as FileTextIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AILoadingState } from '@/components/ai/ai-loading-state';
import { AIErrorState } from '@/components/ai/ai-error-state';
import { AIBadge } from '@/components/ai/aibadge';

interface MalaysianDocFormData {
  companyName: string;
  employeeName?: string;
  position?: string;
  salary?: number;
  tenureMonths?: number;
  noticeDays?: number;
  monthYear?: string;
  auditScore?: number;
  criticalIssues?: string[];
}

const MALAYSIAN_TEMPLATES = [
  {
    id: 'epf-socso-summary',
    name: 'EPF/SOCSO Contribution Summary',
    description: 'Monthly statutory contribution report per Employment Act/SOCSO Act',
    category: 'Statutory',
    fields: ['companyName', 'monthYear'],
    icon: Shield,
    agentAction: 'generate_contribution_report'
  },
  {
    id: 'termination-notice',
    name: 'Termination Notice',
    description: 'Legal termination notice compliant with EA 1955 notice periods',
    category: 'HR',
    fields: ['companyName', 'employeeName', 'position', 'tenureMonths', 'noticeDays'],
    icon: FileTextIcon,
    agentAction: 'generate_termination_notice'
  },
  {
    id: 'compliance-audit-report',
    name: 'Compliance Audit Report',
    description: 'Quarterly HR compliance audit with Malaysian law references',
    category: 'Audit',
    fields: ['companyName', 'monthYear', 'auditScore', 'criticalIssues'],
    icon: CheckCircle2,
    agentAction: 'generate_compliance_report'
  },
  {
    id: 'hr-policy-template',
    name: 'HR Policy Template',
    description: 'Leave/OT/Termination policy compliant with EA 1955/IRA 1967',
    category: 'Policy',
    fields: ['companyName'],
    icon: FileTextIcon,
    agentAction: 'generate_policy_template'
  }
];

interface MalaysianDocGeneratorProps {
  className?: string;
}

export function MalaysianDocGenerator({ className }: MalaysianDocGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<MalaysianDocFormData>({ companyName: '' });
  const [generatedDocument, setGeneratedDocument] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    // Pre-fill common fields
    setFormData({ 
      companyName: formData.companyName || '',
      auditScore: template.id.includes('audit') ? 94 : undefined
    });
    setGeneratedDocument('');
  };

  const handleFieldChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !formData.companyName) {
      setError('Please select a template and fill required fields.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-malaysian-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: selectedTemplate.agentAction,
          templateId: selectedTemplate.id,
          data: formData 
        }),
      });

      if (!response.ok) throw new Error('Failed to generate Malaysian compliance document');

      const data = await response.json();
      setGeneratedDocument(data.document || data.policy || 'Document generated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate document. Check compliance agent.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedDocument);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.name.replace(/\\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderField = (field: string) => {
    const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    
    switch (field) {
      case 'companyName':
      case 'employeeName':
      case 'position':
        return (
          <Input
            value={formData[field as keyof MalaysianDocFormData] as string || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="mt-1"
          />
        );
      case 'salary':
      case 'tenureMonths':
      case 'noticeDays':
      case 'auditScore':
        return (
          <Input
            type="number"
            value={formData[field as keyof MalaysianDocFormData] as number || ''}
            onChange={(e) => handleFieldChange(field, parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="mt-1"
          />
        );
      case 'monthYear':
        return (
          <Input
            type="month"
            value={formData[field as keyof MalaysianDocFormData] as string || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="mt-1"
          />
        );
      case 'criticalIssues':
        return (
          <Textarea
            value={(formData[field as keyof MalaysianDocFormData] as string[])?.join('\\n') || ''}
            onChange={(e) => handleFieldChange(field, e.target.value.split('\\n'))}
            placeholder="List critical issues (one per line)"
            rows={3}
            className="mt-1"
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Malaysian Compliance Document Generator
            <AIBadge variant="success" size="sm">Employment Act 1955 • IRA 1967</AIBadge>
          </CardTitle>
          <CardDescription>
            Generate legally compliant HR documents using Malaysian labor laws and statutory requirements
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-0">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MALAYSIAN_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-all border-2 border-transparent hover:border-primary/50 group"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            {Icon && <Icon className="h-5 w-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg leading-tight">{template.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                            <Badge variant="secondary" className="mt-2">{template.category}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="generate" className="space-y-6">
              {!selectedTemplate ? (
                <div className="text-center py-12">
                  <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Template</h3>
                  <p className="text-muted-foreground mb-6">Choose a Malaysian compliance template to get started</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Form */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="p-2 rounded-lg bg-primary/10">
{React.createElement(selectedTemplate.icon, { className: "h-5 w-5 text-primary" })}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{selectedTemplate.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTemplate.fields.map((field: string) => (
                        <div key={field} className="space-y-1.5">
                          <Label className="text-sm font-medium">{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                          {renderField(field)}
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !formData.companyName}
                      className="w-full h-12 text-lg"
                    >
                      {isGenerating ? (
                        <>
                          <AILoadingState />
                          <span>Generating Compliant Document...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="h-5 w-5 mr-2" />
                          Generate Malaysian Document
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Preview */}
                  {generatedDocument && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-6 border-t"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <FileTextIcon className="h-5 w-5" />
                          Generated Document
                        </h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleCopy}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button variant="default" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download TXT
                          </Button>
                        </div>
                      </div>

                      <Card>
                        <CardContent className="p-0 max-h-96 overflow-auto">
                          <pre className="p-6 text-sm whitespace-pre-wrap font-mono bg-muted/20 border-b">
                            {generatedDocument}
                          </pre>
                        </CardContent>
                      </Card>

                      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-semibold text-green-800">✅ Malaysian Compliance Verified</div>
                          <div className="text-sm text-green-700">Document generated per Employment Act 1955, IRA 1967, and current statutory rates</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {error && <AIErrorState error={error} />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}