"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BookTemplate, Edit3, Save, Eye, Download, Plus } from 'lucide-react';
import { AIFormGenerator } from './aiform-generator';
import { AILoadingState } from './ailoading-state';
import { AIErrorState } from './aierror-state';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: string[];
  template: string;
}

interface AIDocumentTemplateGeneratorProps {
  className?: string;
}

const SAMPLE_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'offer-letter',
    name: 'Job Offer Letter',
    description: 'Professional job offer letter template',
    category: 'HR',
    fields: ['candidateName', 'position', 'salary', 'startDate', 'companyName'],
    template: `Dear {{candidateName}},

We are pleased to offer you the position of {{position}} at {{companyName}}.

Your starting salary will be {{salary}} per annum, and your start date will be {{startDate}}.

We look forward to welcoming you to our team.

Best regards,
{{companyName}} HR Team`
  },
  {
    id: 'performance-review',
    name: 'Performance Review',
    description: 'Employee performance evaluation template',
    category: 'HR',
    fields: ['employeeName', 'reviewPeriod', 'achievements', 'areasForImprovement', 'rating'],
    template: `Performance Review for {{employeeName}}

Review Period: {{reviewPeriod}}

Achievements:
{{achievements}}

Areas for Improvement:
{{areasForImprovement}}

Overall Rating: {{rating}}/5

Comments:`
  },
  {
    id: 'meeting-minutes',
    name: 'Meeting Minutes',
    description: 'Standard meeting minutes template',
    category: 'General',
    fields: ['meetingTitle', 'date', 'attendees', 'agenda', 'decisions', 'actionItems'],
    template: `Meeting Minutes: {{meetingTitle}}

Date: {{date}}
Attendees: {{attendees}}

Agenda:
{{agenda}}

Decisions Made:
{{decisions}}

Action Items:
{{actionItems}}`
  }
];

export function AIDocumentTemplateGenerator({ className }: AIDocumentTemplateGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [generatedDocument, setGeneratedDocument] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('templates');

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFieldValues({});
    setGeneratedDocument('');
  };

  const handleFieldChange = (field: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    setError('');

    try {
      let document = selectedTemplate.template;
      selectedTemplate.fields.forEach(field => {
        const value = fieldValues[field] || `{{${field}}}`;
        document = document.replace(new RegExp(`{{${field}}}`, 'g'), value);
      });
      setGeneratedDocument(document);
    } catch (err) {
      setError('Failed to generate document from template');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedDocument || !selectedTemplate) return;

    const blob = new Blob([generatedDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = [...new Set(SAMPLE_TEMPLATES.map(t => t.category))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
<BookTemplate className="h-5 w-5" />
            AI Document Template Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SAMPLE_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <Badge variant="secondary" className="w-fit">
                        {template.category}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="customize" className="space-y-4">
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTemplate.fields.map((field) => (
                      <div key={field}>
                        <Label htmlFor={field} className="capitalize">
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        {field.includes('description') || field.includes('comments') ? (
                          <Textarea
                            id={field}
                            value={fieldValues[field] || ''}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            placeholder={`Enter ${field}`}
                            rows={3}
                          />
                        ) : (
                          <Input
                            id={field}
                            value={fieldValues[field] || ''}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            placeholder={`Enter ${field}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <AILoadingState />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Generate Document
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a template first
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {generatedDocument ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generated Document</h3>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {generatedDocument}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Generate a document to see the preview
                </div>
              )}
            </TabsContent>
          </Tabs>

          {error && <AIErrorState error={error} />}
        </CardContent>
      </Card>
    </motion.div>
  );
}