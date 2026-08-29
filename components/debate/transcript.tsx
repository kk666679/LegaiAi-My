"use client";

import { cn } from '@/lib/utils';
import { User, Gavel, MessageSquare } from 'lucide-react';
import type { DebateRound } from '@/types/debate';

const roleConfig: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, cls: string, label: string }> = {
  applicant: { 
    icon: User, 
    color: '#00c8ff', 
    cls: 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 text-cyan-300', 
    label: 'Applicant' 
  },
  respondent: { 
    icon: User, 
    color: '#a855f7', 
    cls: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-purple-300', 
    label: 'Respondent' 
  },
  judge: { 
    icon: Gavel, 
    color: '#facc15', 
    cls: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 text-yellow-300', 
    label: 'Judge' 
  },
};

interface TranscriptProps {
  rounds: DebateRound[];
}

export function Transcript({ rounds }: TranscriptProps) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4 bg-black/20 rounded-2xl">
      {rounds.map((round, idx) => {
        const cfg = roleConfig[round.role];
        if (!cfg) return null;
        const Icon = cfg.icon;
        return (
          <div key={idx} className={cn('p-4 rounded-xl border backdrop-blur-sm', cfg.cls)}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 flex-shrink-0 text-[#00c8ff]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[#00c8ff]">
                {cfg.label} - Round {round.roundNum}
              </span>
              {round.score !== undefined && (
                <span className="ml-auto text-xs bg-white/10 px-2 py-1 rounded-full text-[#00c8ff]">
                  Score: {round.score}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{round.argument}</p>
            <div className="text-xs text-gray-500 mt-2 opacity-75">
              {new Date(round.timestamp).toLocaleTimeString()}
            </div>
          </div>
        );
      })}
      {rounds.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Start a debate to see the transcript</p>
        </div>
      )}
    </div>
  );
}

