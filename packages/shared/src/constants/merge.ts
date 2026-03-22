export const MERGE_STATUS = {
  PROPOSED: 'proposed',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
} as const;

export type MergeStatus = (typeof MERGE_STATUS)[keyof typeof MERGE_STATUS];

export const MERGE_STATUSES = Object.values(MERGE_STATUS);

export const MERGE_STATUS_LABELS: Record<MergeStatus, string> = {
  proposed: 'Proposed',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};
