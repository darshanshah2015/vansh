export interface MergeProposal {
  id: string;
  sourceTreeId: string;
  targetTreeId: string;
  proposedById: string;
  status: string;
  reason: string | null;
  reviewedById: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface MergeProposalMapping {
  id: string;
  proposalId: string;
  sourcePersonId: string;
  targetPersonId: string | null;
  resolution: string | null;
}
