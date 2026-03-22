export const NOTIFICATION_TYPE = {
  CLAIM_SUBMITTED: 'claim_submitted',
  CLAIM_APPROVED: 'claim_approved',
  CLAIM_REJECTED: 'claim_rejected',
  PERSON_UPDATED: 'person_updated',
  PERSON_ADDED: 'person_added',
  TREE_MERGED: 'tree_merged',
  MERGE_PROPOSED: 'merge_proposed',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
  DELETION_REQUESTED: 'deletion_requested',
  DELETION_APPROVED: 'deletion_approved',
  DELETION_REJECTED: 'deletion_rejected',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPE);

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  claim_submitted: 'Claim Submitted',
  claim_approved: 'Claim Approved',
  claim_rejected: 'Claim Rejected',
  person_updated: 'Person Updated',
  person_added: 'Person Added',
  tree_merged: 'Tree Merged',
  merge_proposed: 'Merge Proposed',
  verification_approved: 'Verification Approved',
  verification_rejected: 'Verification Rejected',
  deletion_requested: 'Deletion Requested',
  deletion_approved: 'Deletion Approved',
  deletion_rejected: 'Deletion Rejected',
};
