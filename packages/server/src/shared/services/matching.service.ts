import { eq, and, or, ilike, sql, ne } from 'drizzle-orm';
import { db } from '@db/index';
import { persons, trees, relationships } from '@db/schema/index';

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function nameSimilarity(name1: string, name2: string): number {
  const a = name1.toLowerCase().trim();
  const b = name2.toLowerCase().trim();
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

interface MatchInput {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | null;
  gotra?: string | null;
  parentNames?: string[];
}

interface MatchResult {
  personId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gotra: string | null;
  treeId: string;
  treeName: string;
  treeSlug: string;
  confidence: number;
}

export async function findMatches(data: MatchInput): Promise<MatchResult[]> {
  // Search for persons with similar names
  const candidates = await db
    .select({
      id: persons.id,
      firstName: persons.firstName,
      lastName: persons.lastName,
      dateOfBirth: persons.dateOfBirth,
      gotra: persons.gotra,
      treeId: persons.treeId,
      treeName: trees.name,
      treeSlug: trees.slug,
    })
    .from(persons)
    .innerJoin(trees, eq(persons.treeId, trees.id))
    .where(
      or(
        ilike(persons.lastName, `%${data.lastName}%`),
        ilike(persons.firstName, `%${data.firstName}%`)
      )
    )
    .limit(50);

  const results: MatchResult[] = [];

  for (const candidate of candidates) {
    let score = 0;

    // Name similarity (30%)
    const firstNameSim = nameSimilarity(data.firstName, candidate.firstName);
    const lastNameSim = nameSimilarity(data.lastName, candidate.lastName);
    score += ((firstNameSim + lastNameSim) / 2) * 30;

    // DOB match (25%)
    if (data.dateOfBirth && candidate.dateOfBirth) {
      const d1 = new Date(data.dateOfBirth).toISOString().slice(0, 10);
      const d2 = new Date(candidate.dateOfBirth).toISOString().slice(0, 10);
      if (d1 === d2) {
        score += 25;
      }
    }

    // Gotra match (20%)
    if (data.gotra && candidate.gotra) {
      if (data.gotra.toLowerCase() === candidate.gotra.toLowerCase()) {
        score += 20;
      }
    }

    // Parent name overlap (25%)
    if (data.parentNames && data.parentNames.length > 0) {
      const parentRels = await db
        .select({ personId1: relationships.personId1 })
        .from(relationships)
        .where(
          and(
            eq(relationships.personId2, candidate.id),
            eq(relationships.relationshipType, 'parent_child')
          )
        );

      if (parentRels.length > 0) {
        const parentIds = parentRels.map((r) => r.personId1);
        const parents = await db
          .select({ firstName: persons.firstName, lastName: persons.lastName })
          .from(persons)
          .where(sql`${persons.id} = any(${parentIds})`);

        const parentFullNames = parents.map(
          (p) => `${p.firstName} ${p.lastName}`.toLowerCase()
        );
        let parentMatches = 0;
        for (const pName of data.parentNames) {
          const pNameLower = pName.toLowerCase();
          if (parentFullNames.some((n) => nameSimilarity(pNameLower, n) > 0.7)) {
            parentMatches++;
          }
        }
        score += (parentMatches / data.parentNames.length) * 25;
      }
    }

    if (score >= 40) {
      results.push({
        personId: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        dateOfBirth: candidate.dateOfBirth,
        gotra: candidate.gotra,
        treeId: candidate.treeId,
        treeName: candidate.treeName,
        treeSlug: candidate.treeSlug,
        confidence: Math.round(score),
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}
