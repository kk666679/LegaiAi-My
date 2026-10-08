export interface LearningProposal {
  id: string; targetId: string;
  targetType: 'agent' | 'skill' | 'tool' | 'policy';
  description: string; expectedImpact?: string;
  status: 'draft' | 'pending-safety' | 'pending-approval' | 'approved' | 'rejected' | 'deployed';
  createdAt: string;
}
