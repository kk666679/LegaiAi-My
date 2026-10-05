import GlassCard from '@/components/lawmate/GlassCard';
import { cn } from '@/lib/utils';

interface ScoreboardProps {
  applicant: number;
  respondent: number;
  winner: 'applicant' | 'respondent' | null;
}

export function Scoreboard({ applicant, respondent, winner }: ScoreboardProps) {
  const total = applicant + respondent || 1;
  const applicantPct = (applicant / total) * 100;
  const respondentPct = (respondent / total) * 100;

  return (
    <GlassCard className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between text-sm font-semibold text-gray-300">
          <span>Applicant</span>
          <span>{applicant.toFixed(1)}</span>
        </div>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${applicantPct}%` }}
          />
        </div>
        <div className="flex justify-between text-sm font-semibold text-gray-300">
          <span>Respondent</span>
          <span>{respondent.toFixed(1)}</span>
        </div>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${respondentPct}%` }}
          />
        </div>
        {winner && (
          <div className={cn(
            'text-center py-2 px-4 rounded-lg text-sm font-bold',
            winner === 'applicant' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          )}>
            Winner: {winner.toUpperCase()}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

