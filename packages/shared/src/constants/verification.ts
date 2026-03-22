export const VERIFICATION_STATUS = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export type VerificationStatus =
  (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

export const VERIFICATION_STATUSES = Object.values(VERIFICATION_STATUS);

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  unverified: 'Unverified',
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
};
