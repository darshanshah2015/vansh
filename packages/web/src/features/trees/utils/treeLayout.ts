export interface PersonNode {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  isAlive: boolean;
  photoKey: string | null;
  dateOfBirth?: string | null;
  dateOfDeath?: string | null;
  claimedByUserId?: string | null;
}

export interface RelationshipEdge {
  id: string;
  personId1: string;
  personId2: string;
  relationshipType: string;
}

export interface CoupleNode {
  id: string;
  primary: PersonNode;
  spouse?: PersonNode;
  children?: CoupleNode[];
}

/**
 * Builds a family hierarchy using couple nodes.
 * Spouses are grouped into a single node so D3 can lay them out side-by-side.
 */
export function buildFamilyHierarchy(
  persons: PersonNode[],
  relationships: RelationshipEdge[]
): CoupleNode {
  const personMap = new Map(persons.map((p) => [p.id, p]));

  // Build parent→child map (personId1 is parent, personId2 is child)
  const parentChildRels = relationships.filter((r) => r.relationshipType === 'parent_child');
  const childrenOf = new Map<string, Set<string>>();
  const parentOf = new Map<string, Set<string>>();

  parentChildRels.forEach((r) => {
    if (!childrenOf.has(r.personId1)) childrenOf.set(r.personId1, new Set());
    childrenOf.get(r.personId1)!.add(r.personId2);
    if (!parentOf.has(r.personId2)) parentOf.set(r.personId2, new Set());
    parentOf.get(r.personId2)!.add(r.personId1);
  });

  // Build spouse map
  const spouseRels = relationships.filter((r) => r.relationshipType === 'spouse');
  const spouseMap = new Map<string, string>();
  spouseRels.forEach((r) => {
    spouseMap.set(r.personId1, r.personId2);
    spouseMap.set(r.personId2, r.personId1);
  });

  // Find root: person with no parents
  const childIds = new Set(parentChildRels.map((r) => r.personId2));
  const roots = persons.filter((p) => !childIds.has(p.id));
  const rootPerson = roots[0] ?? persons[0];
  if (!rootPerson) {
    return { id: 'empty', primary: { id: 'empty', firstName: 'Empty', lastName: 'Tree', gender: 'other', isAlive: true, photoKey: null } };
  }

  const visited = new Set<string>();

  function buildNode(personId: string): CoupleNode | null {
    if (visited.has(personId)) return null;
    const person = personMap.get(personId);
    if (!person) return null;

    visited.add(personId);
    const spouseId = spouseMap.get(personId);
    let spouse: PersonNode | undefined;
    if (spouseId && !visited.has(spouseId)) {
      visited.add(spouseId);
      spouse = personMap.get(spouseId);
    }

    // Collect children of both primary and spouse
    const childIds = new Set<string>();
    (childrenOf.get(personId) ?? new Set()).forEach((c) => childIds.add(c));
    if (spouseId) {
      (childrenOf.get(spouseId) ?? new Set()).forEach((c) => childIds.add(c));
    }

    const children: CoupleNode[] = [];
    childIds.forEach((cid) => {
      const child = buildNode(cid);
      if (child) children.push(child);
    });

    return {
      id: spouse ? `couple-${personId}-${spouse.id}` : `single-${personId}`,
      primary: person,
      spouse,
      children: children.length > 0 ? children : undefined,
    };
  }

  let rootNode = buildNode(rootPerson.id);
  if (!rootNode) {
    rootNode = { id: `single-${rootPerson.id}`, primary: rootPerson };
  }

  // Add any unvisited persons as top-level nodes
  const unvisited = persons.filter((p) => !visited.has(p.id));
  if (unvisited.length > 0) {
    if (!rootNode.children) rootNode.children = [];
    unvisited.forEach((p) => {
      if (!visited.has(p.id)) {
        const node = buildNode(p.id);
        if (node) rootNode!.children!.push(node);
      }
    });
  }

  return rootNode;
}
