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
  spouseIsNavigable?: boolean;
  spouseLineageId?: string;
}

/**
 * Builds a family hierarchy using couple nodes.
 * Spouses are grouped into a single node so D3 can lay them out side-by-side.
 *
 * Strategy:
 * 1. Find the deepest ancestor (person with no parents, preferring those who have descendants).
 * 2. Walk down via parent_child, pairing spouses into couple nodes.
 * 3. Any unplaced persons that are parents of already-placed persons get
 *    wrapped into a virtual root so they appear ABOVE, not as siblings.
 * 4. Truly disconnected persons appear as separate branches.
 */
export function buildFamilyHierarchy(
  persons: PersonNode[],
  relationships: RelationshipEdge[]
): CoupleNode {
  const personMap = new Map(persons.map((p) => [p.id, p]));

  // Build parent→child and child→parent maps
  const parentChildRels = relationships.filter((r) => r.relationshipType === 'parent_child');
  const childrenOf = new Map<string, Set<string>>();
  const parentsOf = new Map<string, Set<string>>();

  parentChildRels.forEach((r) => {
    if (!childrenOf.has(r.personId1)) childrenOf.set(r.personId1, new Set());
    childrenOf.get(r.personId1)!.add(r.personId2);
    if (!parentsOf.has(r.personId2)) parentsOf.set(r.personId2, new Set());
    parentsOf.get(r.personId2)!.add(r.personId1);
  });

  // Build spouse map
  const spouseRels = relationships.filter((r) => r.relationshipType === 'spouse');
  const spouseMap = new Map<string, string>();
  spouseRels.forEach((r) => {
    spouseMap.set(r.personId1, r.personId2);
    spouseMap.set(r.personId2, r.personId1);
  });
  inferCoParentsAsCouples(parentsOf, spouseMap);

  // Find the best root: walk up from every person to find the topmost ancestor
  function getAncestorDepth(id: string, visited: Set<string>): number {
    if (visited.has(id)) return 0;
    visited.add(id);
    const parents = parentsOf.get(id);
    if (!parents || parents.size === 0) return 0;
    let maxDepth = 0;
    parents.forEach((pid) => {
      maxDepth = Math.max(maxDepth, 1 + getAncestorDepth(pid, visited));
    });
    return maxDepth;
  }

  // Count descendants
  function getDescendantCount(id: string, visited: Set<string>): number {
    if (visited.has(id)) return 0;
    visited.add(id);
    const children = childrenOf.get(id);
    if (!children || children.size === 0) return 0;
    let count = 0;
    children.forEach((cid) => {
      count += 1 + getDescendantCount(cid, visited);
    });
    return count;
  }

  // Find all persons with no parents
  const childIdSet = new Set(parentChildRels.map((r) => r.personId2));
  const topAncestors = persons.filter((p) => !childIdSet.has(p.id));

  // Sort: prefer ancestors with most descendants (main family line)
  topAncestors.sort((a, b) => {
    const aDesc = getDescendantCount(a.id, new Set());
    const bDesc = getDescendantCount(b.id, new Set());
    return bDesc - aDesc;
  });

  const rootPerson = topAncestors[0] ?? persons[0];
  if (!rootPerson) {
    return { id: 'empty', primary: { id: 'empty', firstName: 'Empty', lastName: 'Tree', gender: 'other', isAlive: true, photoKey: null } };
  }

  const placed = new Set<string>();

  function buildNode(personId: string): CoupleNode | null {
    if (placed.has(personId)) return null;
    const person = personMap.get(personId);
    if (!person) return null;

    placed.add(personId);

    // Find and pair spouse
    const spouseId = spouseMap.get(personId);
    let spouse: PersonNode | undefined;
    if (spouseId && !placed.has(spouseId)) {
      placed.add(spouseId);
      spouse = personMap.get(spouseId);
    }

    // Collect children of both primary and spouse
    const allChildIds = new Set<string>();
    (childrenOf.get(personId) ?? new Set()).forEach((c) => allChildIds.add(c));
    if (spouseId) {
      (childrenOf.get(spouseId) ?? new Set()).forEach((c) => allChildIds.add(c));
    }

    const children: CoupleNode[] = [];
    allChildIds.forEach((cid) => {
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

  // Handle unplaced persons
  const unplaced = persons.filter((p) => !placed.has(p.id));
  if (unplaced.length > 0) {
    // Separate into: parents-of-placed (should be above) vs truly disconnected (below)
    const parentOfPlaced: PersonNode[] = [];
    const disconnected: PersonNode[] = [];

    for (const p of unplaced) {
      if (placed.has(p.id)) continue;
      const children = childrenOf.get(p.id);
      const isParentOfPlaced = children && [...children].some((c) => placed.has(c));
      if (isParentOfPlaced) {
        parentOfPlaced.push(p);
      } else {
        disconnected.push(p);
      }
    }

    // Parents of placed persons: wrap the current root under a virtual root
    // that includes these ancestor branches
    if (parentOfPlaced.length > 0) {
      for (const p of parentOfPlaced) {
        if (placed.has(p.id)) continue;
        const node = buildNode(p.id);
        if (node) {
          // This person is a parent of someone in the tree but wasn't traversed
          // (e.g., in-law's parent). Add as a separate top-level branch.
          // Create a virtual root to hold both the main tree and this branch.
          const virtualRoot: CoupleNode = {
            id: 'virtual-root',
            primary: { id: 'virtual-root', firstName: '', lastName: '', gender: 'other', isAlive: true, photoKey: null },
            children: [rootNode, node],
          };
          // Flatten: if rootNode is already a virtual root, just add to its children
          if (rootNode.id === 'virtual-root') {
            rootNode.children!.push(node);
          } else {
            rootNode = virtualRoot;
          }
        }
      }
    }

    // Truly disconnected persons: add as branches
    for (const p of disconnected) {
      if (placed.has(p.id)) continue;
      const node = buildNode(p.id);
      if (node) {
        if (!rootNode.children) rootNode.children = [];
        rootNode.children.push(node);
      }
    }
  }

  return rootNode;
}

/**
 * Builds a lineage-focused hierarchy for a single bloodline.
 *
 * Strategy:
 * 1. Walk UP from focusPersonId via parent_child to find all ancestors.
 * 2. Walk DOWN from the topmost ancestors to find all descendants.
 * 3. Union = "lineageSet" (the blood family).
 * 4. Spouses of lineageSet members are shown but NOT expanded.
 * 5. Spouses with parents in the DB get spouseIsNavigable = true.
 */
export function buildLineageHierarchy(
  persons: PersonNode[],
  relationships: RelationshipEdge[],
  focusPersonId: string
): CoupleNode {
  const personMap = new Map(persons.map((p) => [p.id, p]));

  // Build parent→child and child→parent maps
  const parentChildRels = relationships.filter((r) => r.relationshipType === 'parent_child');
  const childrenOf = new Map<string, Set<string>>();
  const parentsOf = new Map<string, Set<string>>();

  parentChildRels.forEach((r) => {
    if (!childrenOf.has(r.personId1)) childrenOf.set(r.personId1, new Set());
    childrenOf.get(r.personId1)!.add(r.personId2);
    if (!parentsOf.has(r.personId2)) parentsOf.set(r.personId2, new Set());
    parentsOf.get(r.personId2)!.add(r.personId1);
  });

  // Build spouse map
  const spouseRels = relationships.filter((r) => r.relationshipType === 'spouse');
  const spouseMap = new Map<string, string>();
  spouseRels.forEach((r) => {
    spouseMap.set(r.personId1, r.personId2);
    spouseMap.set(r.personId2, r.personId1);
  });
  inferCoParentsAsCouples(parentsOf, spouseMap);

  // Step 1: Walk UP to find all ancestors of the focus person
  const lineageSet = new Set<string>();

  function walkUp(id: string) {
    if (lineageSet.has(id)) return;
    lineageSet.add(id);
    const parents = parentsOf.get(id);
    if (parents) parents.forEach((pid) => walkUp(pid));
  }
  walkUp(focusPersonId);

  // Step 2: Walk DOWN from all ancestors to find all descendants
  const walkDownVisited = new Set<string>();
  function walkDown(id: string) {
    if (walkDownVisited.has(id)) return;
    walkDownVisited.add(id);
    lineageSet.add(id);
    const children = childrenOf.get(id);
    if (!children) return;
    children.forEach((cid) => {
      // Only add children who share a parent already in the lineage
      // (prevents following in-law branches)
      const childParents = parentsOf.get(cid);
      const hasLineageParent = childParents && [...childParents].some((p) => lineageSet.has(p));
      if (hasLineageParent) {
        lineageSet.add(cid);
        walkDown(cid);
      }
    });
  }

  // Walk down from all topmost ancestors in the lineage
  const topAncestors = [...lineageSet].filter((id) => {
    const parents = parentsOf.get(id);
    return !parents || ![...parents].some((p) => lineageSet.has(p));
  });
  topAncestors.forEach((id) => walkDown(id));

  // Determine which spouses have parents in the DB (navigable)
  const spouseHasParents = new Set<string>();
  persons.forEach((p) => {
    const parents = parentsOf.get(p.id);
    if (parents && parents.size > 0 && !lineageSet.has(p.id)) {
      spouseHasParents.add(p.id);
    }
  });

  // Step 3: Build the tree using only lineage members + their spouses
  const placed = new Set<string>();

  function buildLineageNode(personId: string): CoupleNode | null {
    if (placed.has(personId)) return null;
    if (!lineageSet.has(personId)) return null;
    const person = personMap.get(personId);
    if (!person) return null;

    placed.add(personId);

    // Find spouse (not in lineage — married-in)
    const spouseId = spouseMap.get(personId);
    let spouse: PersonNode | undefined;
    let navigable = false;
    let navigableId: string | undefined;

    if (spouseId && !placed.has(spouseId)) {
      placed.add(spouseId);
      spouse = personMap.get(spouseId);
      if (spouse && spouseHasParents.has(spouseId)) {
        navigable = true;
        navigableId = spouseId;
      }
    }

    // Collect children — only those in the lineage
    const allChildIds = new Set<string>();
    (childrenOf.get(personId) ?? new Set()).forEach((c) => {
      if (lineageSet.has(c)) allChildIds.add(c);
    });
    if (spouseId) {
      (childrenOf.get(spouseId) ?? new Set()).forEach((c) => {
        if (lineageSet.has(c)) allChildIds.add(c);
      });
    }

    const children: CoupleNode[] = [];
    allChildIds.forEach((cid) => {
      const child = buildLineageNode(cid);
      if (child) children.push(child);
    });

    return {
      id: spouse ? `couple-${personId}-${spouse.id}` : `single-${personId}`,
      primary: person,
      spouse,
      children: children.length > 0 ? children : undefined,
      spouseIsNavigable: navigable || undefined,
      spouseLineageId: navigableId,
    };
  }

  // Find root: topmost ancestor with most descendants
  const sortedRoots = topAncestors
    .map((id) => ({ id, desc: countLineageDescendants(id, childrenOf, lineageSet) }))
    .sort((a, b) => b.desc - a.desc);

  const rootPersonId = sortedRoots[0]?.id ?? focusPersonId;
  let rootNode = buildLineageNode(rootPersonId);

  if (!rootNode) {
    const person = personMap.get(focusPersonId);
    rootNode = {
      id: `single-${focusPersonId}`,
      primary: person ?? { id: focusPersonId, firstName: 'Unknown', lastName: '', gender: 'other', isAlive: true, photoKey: null },
    };
  }

  return rootNode;
}

function countLineageDescendants(
  id: string,
  childrenOf: Map<string, Set<string>>,
  lineageSet: Set<string>,
  visited = new Set<string>()
): number {
  if (visited.has(id)) return 0;
  visited.add(id);
  const children = childrenOf.get(id);
  if (!children) return 0;
  let count = 0;
  children.forEach((cid) => {
    if (lineageSet.has(cid)) {
      count += 1 + countLineageDescendants(cid, childrenOf, lineageSet, visited);
    }
  });
  return count;
}

function inferCoParentsAsCouples(
  parentsOf: Map<string, Set<string>>,
  spouseMap: Map<string, string>
) {
  parentsOf.forEach((parentIds) => {
    const parents = [...parentIds];
    if (parents.length !== 2) return;
    const [parentA, parentB] = parents;
    if (!spouseMap.has(parentA) && !spouseMap.has(parentB)) {
      spouseMap.set(parentA, parentB);
      spouseMap.set(parentB, parentA);
    }
  });
}
