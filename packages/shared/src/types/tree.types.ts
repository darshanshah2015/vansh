export interface Tree {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdById: string;
  memberCount: number;
  generationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TreeMember {
  id: string;
  treeId: string;
  userId: string;
  status: string;
  joinedAt: string;
}

export interface TreeStats {
  totalMembers: number;
  livingMembers: number;
  deceasedMembers: number;
  generationSpan: number;
  commonGotra: string | null;
  oldestPerson: { name: string; birthYear: number | null } | null;
  youngestPerson: { name: string; birthYear: number | null } | null;
}
