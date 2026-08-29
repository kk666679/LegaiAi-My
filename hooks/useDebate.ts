"use client";

import { useState, useEffect } from 'react';
import type { DebateRound, DebateScores } from '@/types/debate';
import { DebateRole } from '@/types/debate';

export function useDebate(debateId?: string) {
  const [rounds, setRounds] = useState<DebateRound[]>([]);
  const [scores, setScores] = useState<DebateScores | null>(null);
  const [winner, setWinner] = useState<'applicant' | 'respondent' | null>(null);
  const [judgment, setJudgment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [debateStarted, setDebateStarted] = useState(false);

  const startDebate = () => {
    setLoading(true);
    // tRPC mutation stub
    setTimeout(() => {
      setRounds([
        {
          id: '1',
          role: 'applicant' as DebateRole,
          roundNum: 1,
          argument: 'The detention was unlawful as it violated Article 5 of the Federal Constitution...',
          score: 8.2,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          role: 'respondent' as DebateRole,
          roundNum: 1,
          argument: 'The detention was necessary under the Security Offences Act for public safety...',
          score: 7.9,
          timestamp: new Date(Date.now() + 1000).toISOString(),
        },
        {
          id: '3',
          role: 'judge' as DebateRole,
          roundNum: 1,
          argument: 'Round 1 analysis: Applicant presents stronger constitutional argument...',
          timestamp: new Date(Date.now() + 2000).toISOString(),
        },
      ]);
      setScores({ applicant: 8.2, respondent: 7.9 });
      setDebateStarted(true);
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    if (scores && scores.applicant > scores.respondent) {
      setWinner('applicant');
      setJudgment('Applicant wins the debate based on superior legal reasoning.');
    } else if (scores) {
      setWinner('respondent');
      setJudgment('Respondent prevails with robust statutory defense.');
    }
  }, [scores]);

  return {
    rounds,
    scores,
    winner,
    judgment,
    loading,
    debateStarted,
    startDebate,
  };
}

