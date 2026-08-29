"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Calculator,
  Plus,
  X,
  Loader2,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Activity
} from "lucide-react";
import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader, ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";

interface TrendResult {
  trend: "rising" | "falling" | "stable" | "insufficient_data";
  score: number;
  mean: number;
  lastValue: number;
  deviation: number;
  series: number[];
}

export function TrendAnalyzer({ data }: { data: number[] }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TrendResult | null>(null);

  const analyzeTrend = () => {
    setAnalyzing(true);
    // Mock trend analysis
    setTimeout(() => {
      const len = data.length;
      const mean = data.reduce((a, b) => a + b, 0) / len;
      const lastValue = data[len - 1] ?? 0;
      const deviation = mean !== 0 ? Math.abs(lastValue - mean) / mean : 0;
      const trendScore = data.slice(-5).reduce((sum, v, i, arr) => sum + (v - (arr[i-1] ?? 0)), 0) / 4; 
      
      const trend = trendScore > 0.1 ? 'rising' as const : trendScore < -0.1 ? 'falling' as const : 'stable' as const;
      setResult({
        trend,
        score: Math.abs(trendScore),
        mean,
        lastValue,
        deviation,
        series: data,
      });
      setAnalyzing(false);
    }, 1500);
  };

  if (data.length < 3) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Need at least 3 data points for trend analysis.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Analysis</CardTitle>
        <CardDescription>Analyze case citation frequency or confidence trends.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button onClick={analyzeTrend} disabled={analyzing}>
            {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
            Analyze
          </Button>
        </div>
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-lg px-4 py-2">
                {result.trend.toUpperCase()}
              </Badge>
              <span className="text-2xl font-bold">{(result.score * 100).toFixed(1)}%</span>
            </div>
            <Progress value={result.score * 100} />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Mean: {result.mean.toFixed(2)}</div>
              <div>Last: {result.lastValue?.toFixed(2) ?? 'N/A'}</div>
              <div>Deviation: {(result.deviation * 100).toFixed(1)}%</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
