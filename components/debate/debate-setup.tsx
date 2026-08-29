"use client";
import GlassCard from '@/components/legalai/GlassCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export function DebateSetup({ onStart }: { onStart?: () => void }) {
  const [problem, setProblem] = useState('');
  const [citations, setCitations] = useState('');
  const [rounds, setRounds] = useState('2');

  const handleStart = async () => {
    // tRPC mutation stub
    console.log({ problem, citations: citations.split('\n'), rounds: parseInt(rounds) });
    onStart?.();
  };

  return (
    <GlassCard className="space-y-4 p-6">
      <h2 className="text-xl font-bold">Problem Statement</h2>
      <Textarea
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        placeholder="e.g. Whether the detention of the applicant under the Security Offences Act was lawful..."
        rows={4}
      />
      <div>
        <label className="text-sm font-medium mb-1 block">Citations (optional, one per line)</label>
        <Textarea
          value={citations}
          onChange={(e) => setCitations(e.target.value)}
          placeholder="e.g. [2023] 1 MLJ 123&#10;Constitution of Malaysia, Art 5"
          rows={3}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Number of Rounds</label>
        <Select value={rounds} onValueChange={setRounds}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Rounds</SelectItem>
            <SelectItem value="3">3 Rounds</SelectItem>
            <SelectItem value="4">4 Rounds</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleStart} className="w-full">
        Start Debate
      </Button>
    </GlassCard>
  );
}

