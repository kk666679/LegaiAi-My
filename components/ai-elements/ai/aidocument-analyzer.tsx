"use client";

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, Brain, CheckCircle, AlertCircle, Edit3, Save } from 'lucide-react';
import { AIChatAssistant } from './aichat-assistant';
import { AILoadingState } from './ailoading-state';
import { AIErrorState } from './aierror-state';
import { AIProgressCard } from './aiprogress-card';

interface AIDocumentAnalyzerProps {
  className?: string;
}

interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  readability: number;
  suggestions: string[];
  compliance: {
    score: number;
    issues: string[];
  };
}

export function AIDocumentAnalyzer({ className }: AIDocumentAnalyzerProps) {
  const [documentText, setDocumentText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setDocumentText(text);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!documentText.trim()) {
      setError('Please provide document text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setProgress(0);
    setAnalysisResult(null);

    try {
      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Simulate AI analysis - in real implementation, this would call an AI service
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: documentText }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Failed to analyze document');

      const data = await response.json();
      setAnalysisResult(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze document');
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
            <Brain className="h-5 w-5" />
            AI Document Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="document-text">Document Text</Label>
              <Textarea
                id="document-text"
                placeholder="Paste your document text here, or upload a file..."
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                rows={8}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !documentText.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <AILoadingState />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Document
              </>
            )}
          </Button>

          {isAnalyzing && (
            <AIProgressCard
              title="Analyzing Document"
              progress={progress}
              description="Extracting insights, checking compliance, and generating suggestions..."
            />
          )}

          {error && <AIErrorState error={error} />}

          {analysisResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sentiment</span>
                      <Badge className={getSentimentColor(analysisResult.sentiment)}>
                        {analysisResult.sentiment}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Readability</span>
                      <span className="text-lg font-bold">{analysisResult.readability}/100</span>
                    </div>
                    <Progress value={analysisResult.readability} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Compliance</span>
                      <Badge className={getComplianceColor(analysisResult.compliance.score)}>
                        {analysisResult.compliance.score}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium">Key Points</div>
                    <div className="text-lg font-bold">{analysisResult.keyPoints.length}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.summary}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Edit3 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Compliance Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.compliance.issues.length > 0 ? (
                      <ul className="space-y-2">
                        {analysisResult.compliance.issues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">No compliance issues found</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}