import { eq, and, ilike, count, sql, desc, inArray } from 'drizzle-orm';
import { db } from '@db/index';
import { trees, treeMembers, persons, relationships, auditLogs, users } from '@db/schema/index';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/index';
import * as auditService from '../../../shared/services/audit.service';

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Math.random().toString(36).substring(2, 8)
  );
}

type TreeRecord = typeof trees.$inferSelect;
type PersonRecord = typeof persons.$inferSelect;
type RelationshipRecord = typeof relationships.$inferSelect;

interface WikiTreeProfile {
  Id?: number;
  Name?: string;
  FirstName?: string;
  LastNameAtBirth?: string;
  LastNameCurrent?: string;
  BirthDate?: string;
  BirthLocation?: string;
  DeathDate?: string;
  DeathLocation?: string;
  Gender?: string;
}

interface WikiTreeSearchResponse {
  status?: number;
  matches?: WikiTreeProfile[];
  total?: number;
}

const GENERIC_TREE_NAME_PARTS = new Set(['family', 'vansh', 'tree']);

function familyNameParts(treeName: string) {
  return new Set(
    treeName
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((part) => part && !GENERIC_TREE_NAME_PARTS.has(part))
  );
}

function mainFamilyPersonIds(
  tree: Pick<TreeRecord, 'name'>,
  treePersons: PersonRecord[],
  treeRelationships: RelationshipRecord[]
) {
  const nameParts = familyNameParts(tree.name);
  const coreIds = new Set(
    treePersons
      .filter((person) => nameParts.has(person.lastName.toLowerCase()))
      .map((person) => person.id)
  );

  if (coreIds.size === 0) {
    return new Set(treePersons.map((person) => person.id));
  }

  const visibleIds = new Set(coreIds);

  for (const rel of treeRelationships) {
    if (rel.relationshipType !== 'parent_child') continue;
    if (coreIds.has(rel.personId1) || coreIds.has(rel.personId2)) {
      visibleIds.add(rel.personId1);
      visibleIds.add(rel.personId2);
    }
  }

  for (const rel of treeRelationships) {
    if (rel.relationshipType !== 'spouse') continue;
    if (visibleIds.has(rel.personId1) || visibleIds.has(rel.personId2)) {
      visibleIds.add(rel.personId1);
      visibleIds.add(rel.personId2);
    }
  }

  return visibleIds;
}

function mainFamilyCount(
  tree: Pick<TreeRecord, 'name'>,
  treePersons: PersonRecord[],
  treeRelationships: RelationshipRecord[]
) {
  return mainFamilyPersonIds(tree, treePersons, treeRelationships).size;
}

export async function createTree(data: { name: string; description?: string }, userId: string) {
  const slug = generateSlug(data.name);

  return await db.transaction(async (tx) => {
    const [tree] = await tx
      .insert(trees)
      .values({
        name: data.name,
        description: data.description ?? null,
        slug,
        createdById: userId,
      })
      .returning();

    await tx.insert(treeMembers).values({
      treeId: tree.id,
      userId,
      status: 'active',
    });

    await auditService.logChange({
      treeId: tree.id,
      userId,
      action: 'create',
      entityType: 'tree',
      entityId: tree.id,
      newValue: { name: tree.name, slug: tree.slug },
      tx,
    });

    return tree;
  });
}

export async function getTreeBySlug(slug: string) {
  const [tree] = await db.select().from(trees).where(eq(trees.slug, slug)).limit(1);

  if (!tree) throw new NotFoundError('Tree', slug);

  const [treePersons, treeRelationships] = await Promise.all([
    db.select().from(persons).where(eq(persons.treeId, tree.id)),
    db.select().from(relationships).where(eq(relationships.treeId, tree.id)),
  ]);

  return { ...tree, memberCount: mainFamilyCount(tree, treePersons, treeRelationships) };
}

function yearFromDate(date?: Date | null) {
  return date ? date.getUTCFullYear() : null;
}

function dateForWikiTree(date?: Date | null) {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

function profileYear(date?: string) {
  if (!date || date.startsWith('0000')) return null;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : null;
}

function sameText(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function containsPlace(haystack?: string | null, needle?: string | null) {
  if (!haystack || !needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function scoreWikiTreeProfile(person: PersonRecord, profile: WikiTreeProfile, parents: PersonRecord[]) {
  let score = 0;
  const reasons: string[] = [];

  if (sameText(person.firstName, profile.FirstName)) {
    score += 30;
    reasons.push('first name');
  }

  const profileSurname = profile.LastNameAtBirth ?? profile.LastNameCurrent ?? profile.Name?.split('-')[0];
  if (sameText(person.lastName, profileSurname)) {
    score += 30;
    reasons.push('surname');
  }

  const localBirthYear = yearFromDate(person.dateOfBirth);
  const remoteBirthYear = profileYear(profile.BirthDate);
  if (localBirthYear && remoteBirthYear) {
    const yearDelta = Math.abs(localBirthYear - remoteBirthYear);
    if (yearDelta === 0) {
      score += 24;
      reasons.push('birth year');
    } else if (yearDelta <= 2) {
      score += 12;
      reasons.push('near birth year');
    }
  }

  if (containsPlace(profile.BirthLocation, person.placeOfBirth)) {
    score += 18;
    reasons.push('birth place');
  }

  const parentSurnameMatched = parents.some((parent) => sameText(parent.lastName, profileSurname));
  if (parentSurnameMatched) {
    score += 8;
    reasons.push('family surname');
  }

  return { score, reasons };
}

function profileUrl(profile: WikiTreeProfile) {
  return profile.Name ? `https://www.wikitree.com/wiki/${encodeURIComponent(profile.Name)}` : null;
}

async function searchWikiTreePerson(person: PersonRecord, parents: PersonRecord[]) {
  const params = new URLSearchParams({
    action: 'searchPerson',
    FirstName: person.firstName,
    LastName: person.lastName,
    fields: [
      'Id',
      'Name',
      'FirstName',
      'LastNameAtBirth',
      'LastNameCurrent',
      'BirthDate',
      'BirthLocation',
      'DeathDate',
      'DeathLocation',
      'Gender',
    ].join(','),
    limit: '5',
    dateInclude: 'neither',
    lastNameMatch: 'all',
  });

  const birthDate = dateForWikiTree(person.dateOfBirth);
  if (birthDate) {
    params.set('BirthDate', birthDate);
    params.set('dateSpread', '5');
  }
  if (person.placeOfBirth) params.set('BirthLocation', person.placeOfBirth);

  const father = parents.find((parent) => parent.gender === 'male');
  const mother = parents.find((parent) => parent.gender === 'female');
  if (father) {
    params.set('fatherFirstName', father.firstName);
    params.set('fatherLastName', father.lastName);
  }
  if (mother) {
    params.set('motherFirstName', mother.firstName);
    params.set('motherLastName', mother.lastName);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://api.wikitree.com/api.php?${params}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Vansh/0.1 external-match-search',
      },
    });

    if (!response.ok) return [];
    const payload = (await response.json()) as WikiTreeSearchResponse[] | WikiTreeSearchResponse;
    const result = Array.isArray(payload) ? payload[0] : payload;
    return (result.matches ?? [])
      .map((profile) => {
        const scored = scoreWikiTreeProfile(person, profile, parents);
        return {
          provider: 'WikiTree' as const,
          matchedPersonId: person.id,
          matchedPersonName: `${person.firstName} ${person.lastName}`,
          score: Math.min(scored.score, 100),
          reasons: scored.reasons,
          profile: {
            id: profile.Id,
            wikiTreeId: profile.Name,
            firstName: profile.FirstName,
            lastName: profile.LastNameAtBirth ?? profile.LastNameCurrent,
            birthDate: profile.BirthDate,
            birthLocation: profile.BirthLocation,
            deathDate: profile.DeathDate,
            deathLocation: profile.DeathLocation,
            gender: profile.Gender,
            url: profileUrl(profile),
          },
        };
      })
      .filter((match) => match.score >= 45 && match.profile.url);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function getWikiTreeMatches(slug: string, userId: string) {
  const tree = await getTreeBySlug(slug);
  const member = await db.query.treeMembers.findFirst({
    where: and(eq(treeMembers.treeId, tree.id), eq(treeMembers.userId, userId)),
  });
  if (!member) throw new ForbiddenError('You must be a tree member to search external matches');

  const [treePersons, treeRelationships] = await Promise.all([
    db.select().from(persons).where(eq(persons.treeId, tree.id)),
    db.select().from(relationships).where(eq(relationships.treeId, tree.id)),
  ]);

  const parentsByChildId = new Map<string, PersonRecord[]>();
  const personById = new Map(treePersons.map((person) => [person.id, person]));
  for (const rel of treeRelationships) {
    if (rel.relationshipType !== 'parent_child') continue;
    const parent = personById.get(rel.personId1);
    if (!parent) continue;
    if (!parentsByChildId.has(rel.personId2)) parentsByChildId.set(rel.personId2, []);
    parentsByChildId.get(rel.personId2)!.push(parent);
  }

  const searchablePeople = [...treePersons]
    .filter((person) => person.firstName && person.lastName)
    .sort((a, b) => {
      const aSignals = Number(Boolean(a.dateOfBirth)) + Number(Boolean(a.placeOfBirth));
      const bSignals = Number(Boolean(b.dateOfBirth)) + Number(Boolean(b.placeOfBirth));
      return bSignals - aSignals;
    })
    .slice(0, 6);

  const matchGroups = [];
  for (const person of searchablePeople) {
    const matches = await searchWikiTreePerson(person, parentsByChildId.get(person.id) ?? []);
    if (matches.length > 0) {
      matchGroups.push({
        personId: person.id,
        personName: `${person.firstName} ${person.lastName}`,
        matches: matches.sort((a, b) => b.score - a.score).slice(0, 3),
      });
    }
  }

  return {
    provider: 'WikiTree',
    searchedPeople: searchablePeople.length,
    groups: matchGroups,
  };
}

export async function updateTree(
  slug: string,
  data: { name?: string; description?: string | null },
  userId: string
) {
  const tree = await getTreeBySlug(slug);

  const member = await db.query.treeMembers.findFirst({
    where: and(eq(treeMembers.treeId, tree.id), eq(treeMembers.userId, userId)),
  });
  if (!member) throw new ForbiddenError('You must be a tree member to update this tree');

  const [updated] = await db
    .update(trees)
    .set(data)
    .where(eq(trees.id, tree.id))
    .returning();

  await auditService.logChange({
    treeId: tree.id,
    userId,
    action: 'update',
    entityType: 'tree',
    entityId: tree.id,
    oldValue: { name: tree.name, description: tree.description },
    newValue: data,
  });

  return updated;
}

export async function joinTree(slug: string, userId: string) {
  const tree = await getTreeBySlug(slug);

  const existingMember = await db.query.treeMembers.findFirst({
    where: and(eq(treeMembers.treeId, tree.id), eq(treeMembers.userId, userId)),
  });

  if (!existingMember) {
    await db.insert(treeMembers).values({
      treeId: tree.id,
      userId,
      status: 'active',
    });

    await auditService.logChange({
      treeId: tree.id,
      userId,
      action: 'create',
      entityType: 'tree_member',
      entityId: tree.id,
      newValue: { name: tree.name, slug: tree.slug },
    });
  }

  return tree;
}

export async function listTrees(params: {
  page: number;
  limit: number;
  search?: string;
  gotra?: string;
}) {
  const { page, limit, search } = params;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(ilike(trees.name, `%${search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(trees)
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(trees.createdAt)),
    db.select({ total: count() }).from(trees).where(where),
  ]);

  const [listPersons, listRelationships] =
    items.length > 0
      ? await Promise.all([
          db.select().from(persons).where(inArray(persons.treeId, items.map((tree) => tree.id))),
          db
            .select()
            .from(relationships)
            .where(inArray(relationships.treeId, items.map((tree) => tree.id))),
        ])
      : [[], []];
  const personsByTreeId = new Map<string, PersonRecord[]>();
  const relationshipsByTreeId = new Map<string, RelationshipRecord[]>();
  for (const person of listPersons) {
    if (!personsByTreeId.has(person.treeId)) personsByTreeId.set(person.treeId, []);
    personsByTreeId.get(person.treeId)!.push(person);
  }
  for (const rel of listRelationships) {
    if (!relationshipsByTreeId.has(rel.treeId)) relationshipsByTreeId.set(rel.treeId, []);
    relationshipsByTreeId.get(rel.treeId)!.push(rel);
  }

  return {
    items: items.map((tree) => ({
      ...tree,
      memberCount: mainFamilyCount(
        tree,
        personsByTreeId.get(tree.id) ?? [],
        relationshipsByTreeId.get(tree.id) ?? []
      ),
    })),
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

export async function getTreeStats(slug: string) {
  const tree = await getTreeBySlug(slug);
  const [allPersons, treeRelationships] = await Promise.all([
    db.select().from(persons).where(eq(persons.treeId, tree.id)),
    db.select().from(relationships).where(eq(relationships.treeId, tree.id)),
  ]);
  const visibleIds = mainFamilyPersonIds(tree, allPersons, treeRelationships);
  const visiblePersons = allPersons.filter((person) => visibleIds.has(person.id));

  const totalMembers = visiblePersons.length;
  const livingMembers = visiblePersons.filter((person) => person.isAlive).length;
  const deceasedMembers = visiblePersons.filter((person) => !person.isAlive).length;

  const gotraResult = await db
    .select({
      gotra: persons.gotra,
      cnt: count(),
    })
    .from(persons)
    .where(and(eq(persons.treeId, tree.id), sql`${persons.gotra} is not null`))
    .groupBy(persons.gotra)
    .orderBy(desc(count()))
    .limit(1);

  return {
    totalMembers,
    livingMembers,
    deceasedMembers,
    generationSpan: tree.generationCount,
    commonGotra: gotraResult[0]?.gotra ?? null,
    oldestPerson: null,
    youngestPerson: null,
  };
}

export async function getTreeActivity(slug: string, page: number, limit: number) {
  const tree = await getTreeBySlug(slug);
  const offset = (page - 1) * limit;

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        oldValue: auditLogs.oldValue,
        newValue: auditLogs.newValue,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.treeId, tree.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(auditLogs).where(eq(auditLogs.treeId, tree.id)),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

export async function createTreeFromWizard(
  data: {
    treeName: string;
    self: {
      firstName: string;
      lastName: string;
      gender: 'male' | 'female' | 'other';
      dateOfBirth?: Date;
      placeOfBirth?: string;
      gotra?: string;
    };
    parents?: Array<{
      firstName: string;
      lastName: string;
      gender: 'male' | 'female' | 'other';
      dateOfBirth?: Date;
      placeOfBirth?: string;
    }>;
    spouse?: {
      firstName: string;
      lastName: string;
      gender: 'male' | 'female' | 'other';
      dateOfBirth?: Date;
      placeOfBirth?: string;
      marriageDate?: Date;
    };
    siblings?: Array<{
      firstName: string;
      lastName: string;
      gender: 'male' | 'female' | 'other';
      dateOfBirth?: Date;
      placeOfBirth?: string;
    }>;
  },
  userId: string
) {
  const slug = generateSlug(data.treeName);

  return await db.transaction(async (tx) => {
    // Create tree
    const [tree] = await tx
      .insert(trees)
      .values({ name: data.treeName, slug, createdById: userId })
      .returning();

    // Add user as tree member
    await tx.insert(treeMembers).values({ treeId: tree.id, userId, status: 'active' });

    // Add self as person
    const [selfPerson] = await tx
      .insert(persons)
      .values({
        treeId: tree.id,
        firstName: data.self.firstName,
        lastName: data.self.lastName,
        gender: data.self.gender,
        dateOfBirth: data.self.dateOfBirth ?? null,
        placeOfBirth: data.self.placeOfBirth ?? null,
        gotra: data.self.gotra ?? null,
        claimedByUserId: userId,
      })
      .returning();

    let memberCount = 1;
    const createdPersons: Array<{ id: string; role: string }> = [];

    // Add parents
    if (data.parents) {
      for (const parent of data.parents) {
        const [p] = await tx
          .insert(persons)
          .values({
            treeId: tree.id,
            firstName: parent.firstName,
            lastName: parent.lastName,
            gender: parent.gender,
            dateOfBirth: parent.dateOfBirth ?? null,
            placeOfBirth: parent.placeOfBirth ?? null,
          })
          .returning();

        await tx.insert(relationships).values({
          treeId: tree.id,
          personId1: p.id,
          personId2: selfPerson.id,
          relationshipType: 'parent_child',
        });

        createdPersons.push({ id: p.id, role: 'parent' });
        memberCount++;
      }
    }

    // Add spouse
    if (data.spouse) {
      const [sp] = await tx
        .insert(persons)
        .values({
          treeId: tree.id,
          firstName: data.spouse.firstName,
          lastName: data.spouse.lastName,
          gender: data.spouse.gender,
          dateOfBirth: data.spouse.dateOfBirth ?? null,
          placeOfBirth: data.spouse.placeOfBirth ?? null,
        })
        .returning();

      await tx.insert(relationships).values({
        treeId: tree.id,
        personId1: selfPerson.id,
        personId2: sp.id,
        relationshipType: 'spouse',
        marriageDate: data.spouse.marriageDate ?? null,
      });

      memberCount++;
    }

    // Add siblings (share parents)
    if (data.siblings) {
      for (const sibling of data.siblings) {
        const [sib] = await tx
          .insert(persons)
          .values({
            treeId: tree.id,
            firstName: sibling.firstName,
            lastName: sibling.lastName,
            gender: sibling.gender,
            dateOfBirth: sibling.dateOfBirth ?? null,
            placeOfBirth: sibling.placeOfBirth ?? null,
          })
          .returning();

        // Add parent relationships for siblings too
        for (const parent of createdPersons.filter((p) => p.role === 'parent')) {
          await tx.insert(relationships).values({
            treeId: tree.id,
            personId1: parent.id,
            personId2: sib.id,
            relationshipType: 'parent_child',
          });
        }

        memberCount++;
      }
    }

    // Update member count
    await tx.update(trees).set({ memberCount }).where(eq(trees.id, tree.id));

    await auditService.logChange({
      treeId: tree.id,
      userId,
      action: 'create',
      entityType: 'tree',
      entityId: tree.id,
      newValue: { name: tree.name, slug: tree.slug, memberCount },
      tx,
    });

    return tree;
  });
}

export async function getTreeMembers(slug: string) {
  const tree = await getTreeBySlug(slug);

  return db
    .select({
      id: treeMembers.id,
      userId: treeMembers.userId,
      status: treeMembers.status,
      joinedAt: treeMembers.joinedAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      verificationStatus: users.verificationStatus,
    })
    .from(treeMembers)
    .innerJoin(users, eq(treeMembers.userId, users.id))
    .where(eq(treeMembers.treeId, tree.id));
}
