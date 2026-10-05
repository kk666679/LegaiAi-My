"use client";

import { cn } from '@/lib/utils';
import { Gavel, MessageSquare, User } from 'lucide-react';
import type { DebateRound } from '@/types/debate';

const roleConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; cls: string; label: string }> = {
  opening: { icon: User, cls: 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 text-cyan-300', label: 'Opening' },
  argument: { icon: User, cls: 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 text-cyan-300', label: 'Argument' },
  rebuttal: { icon: User, cls: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-purple-300', label: 'Rebuttal' },
  closing: { icon: Gavel, cls: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 text-yellow-300', label: 'Closing' },
};

interface TranscriptProps {
  rounds: DebateRound[];
}

export function Transcript({ rounds }: TranscriptProps) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4 bg-black/20 rounded-2xl">
      {rounds.map((round, idx) => {
        const cfg = roleConfig[round.type] ?? { icon: MessageSquare, cls: 'border border-border/40 bg-card/50 text-foreground', label: 'Round' };
        const Icon = cfg.icon;
        const timestamp = round.startedAt ?? round.completedAt ?? new Date().toISOString();

        return (
          <div key={round.id ?? idx} className={cn('p-4 rounded-xl border backdrop-blur-sm', cfg.cls)}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4 flex-shrink-0 text-[#00c8ff]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[#00c8ff]">
                {cfg.label} - Round {round.index}
              </span>
              {round.status ? (
                <span className="ml-auto rounded-full bg-white/10 px-2 py-1 text-[10px] text-[#00c8ff]">
                  {round.status}
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{round.title ?? round.brief ?? round.type}</p>
            <div className="mt-2 text-xs text-gray-500 opacity-75">
              {new Date(timestamp).toLocaleTimeString()}
            </div>
          </div>
        );
      })}
      {rounds.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>Start a debate to see the transcript</p>
        </div>
      )}
    </div>
  );
}

