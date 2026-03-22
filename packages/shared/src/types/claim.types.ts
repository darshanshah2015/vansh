export interface Claim {
  id: string;
  personId: string;
  userId: string;
  treeId: string;
  status: string;
  reason: string | null;
  reviewedById: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  autoApproveAt: string | null;
  createdAt: string;
}
