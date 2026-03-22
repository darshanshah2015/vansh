export interface Person {
  id: string;
  treeId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
  isAlive: boolean;
  gotra: string | null;
  phone: string | null;
  email: string | null;
  photoKey: string | null;
  bio: string | null;
  claimedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  treeId: string;
  personId1: string;
  personId2: string;
  relationshipType: string;
  marriageDate: string | null;
  divorceDate: string | null;
  createdAt: string;
}
