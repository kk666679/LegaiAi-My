export type DebateRole = 'applicant' | 'respondent' | 'judge';

export interface DebateRound {
  id: string;
  role: DebateRole;
  roundNum: number;
  argument: string;
  score?: number;
  timestamp: string;
}

export interface DebateScores {
  applicant: number;
  respondent: number;
}


