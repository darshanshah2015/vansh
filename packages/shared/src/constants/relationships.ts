export const RELATIONSHIP_TYPE = {
  PARENT_CHILD: 'parent_child',
  SPOUSE: 'spouse',
  STEP_PARENT_CHILD: 'step_parent_child',
  ADOPTIVE_PARENT_CHILD: 'adoptive_parent_child',
  HALF_SIBLING: 'half_sibling',
} as const;

export type RelationshipType =
  (typeof RELATIONSHIP_TYPE)[keyof typeof RELATIONSHIP_TYPE];

export const RELATIONSHIP_TYPES = Object.values(RELATIONSHIP_TYPE);

export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  parent_child: 'Parent / Child',
  spouse: 'Spouse',
  step_parent_child: 'Step-Parent / Step-Child',
  adoptive_parent_child: 'Adoptive Parent / Child',
  half_sibling: 'Half-Sibling',
};

export const RELATIONSHIP_LINE_STYLES: Record<
  RelationshipType,
  { stroke: string; strokeDasharray: string; label: string }
> = {
  parent_child: { stroke: '#2E7D32', strokeDasharray: '', label: 'Biological' },
  spouse: { stroke: '#F9A825', strokeDasharray: '', label: 'Spouse' },
  step_parent_child: { stroke: '#6B7A6B', strokeDasharray: '8 4', label: 'Step' },
  adoptive_parent_child: { stroke: '#6B7A6B', strokeDasharray: '4 4', label: 'Adoptive' },
  half_sibling: { stroke: '#2E7D32', strokeDasharray: '4 2', label: 'Half-Sibling' },
};
