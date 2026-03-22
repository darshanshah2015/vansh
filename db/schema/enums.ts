import { pgEnum } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);
export const roleEnum = pgEnum('role', ['user', 'admin']);
export const verificationStatusEnum = pgEnum('verification_status', [
  'unverified',
  'pending',
  'verified',
  'rejected',
]);
export const claimStatusEnum = pgEnum('claim_status', ['pending', 'approved', 'rejected']);
export const mergeStatusEnum = pgEnum('merge_status', [
  'proposed',
  'under_review',
  'approved',
  'rejected',
  'completed',
]);
export const relationshipTypeEnum = pgEnum('relationship_type', [
  'parent_child',
  'spouse',
  'step_parent_child',
  'adoptive_parent_child',
  'half_sibling',
]);
export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
  'claim',
  'merge',
  'revert',
]);
export const deletionStatusEnum = pgEnum('deletion_status', [
  'pending',
  'approved',
  'rejected',
]);
export const treeMemberStatusEnum = pgEnum('tree_member_status', ['active', 'inactive']);
