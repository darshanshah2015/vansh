import { db } from './index';
import { users, trees, treeMembers, persons, relationships } from './schema/index';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function seedFamily() {
  console.log('Seeding 3-family tree...');

  // 1. Ensure admin user exists
  let adminUser = await db.query.users.findFirst({
    where: eq(users.email, 'admin@vansh.app'),
  });
  if (!adminUser) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    [adminUser] = await db.insert(users).values({
      email: 'admin@vansh.app',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      verificationStatus: 'verified',
    }).returning();
    console.log('Admin user created');
  }

  // 2. Ensure Rohan user exists
  let rohanUser = await db.query.users.findFirst({
    where: eq(users.email, 'rohan@vansh.app'),
  });
  if (!rohanUser) {
    const passwordHash = await bcrypt.hash('rohan123', 12);
    [rohanUser] = await db.insert(users).values({
      email: 'rohan@vansh.app',
      passwordHash,
      firstName: 'Rohan',
      lastName: 'Jain',
      role: 'user',
      verificationStatus: 'verified',
    }).returning();
    console.log('Rohan user created: rohan@vansh.app / rohan123');
  }

  // 3. Delete existing demo tree if present (to re-seed cleanly)
  const existingTree = await db.query.trees.findFirst({
    where: eq(trees.slug, 'jain-family-demo'),
  });
  if (existingTree) {
    await db.delete(relationships).where(eq(relationships.treeId, existingTree.id));
    await db.delete(persons).where(eq(persons.treeId, existingTree.id));
    await db.delete(treeMembers).where(eq(treeMembers.treeId, existingTree.id));
    await db.delete(trees).where(eq(trees.id, existingTree.id));
    console.log('Deleted existing demo tree');
  }

  // 4. Create tree
  const [tree] = await db.insert(trees).values({
    name: 'Jain Family',
    slug: 'jain-family-demo',
    description: 'Six families connected through marriage — Jain, Sharma, Gupta, Verma, Agarwal, Mehta',
    createdById: rohanUser.id,
    memberCount: 36,
    generationCount: 4,
  }).returning();
  console.log(`Tree created: ${tree.name} (${tree.slug})`);

  await db.insert(treeMembers).values({
    treeId: tree.id,
    userId: rohanUser.id,
    status: 'active',
  });

  // Helper to create a person
  const createPerson = async (data: {
    firstName: string; lastName: string; gender: 'male' | 'female' | 'other';
    dateOfBirth: Date; dateOfDeath?: Date; isAlive: boolean;
    gotra?: string; claimedByUserId?: string;
  }) => {
    const [p] = await db.insert(persons).values({
      treeId: tree.id,
      ...data,
    }).returning();
    return p;
  };

  // =============================================
  // FAMILY 1: JAIN (Husband's / Main paternal side)
  // =============================================
  // Gen 1
  const ramesh = await createPerson({
    firstName: 'Ramesh', lastName: 'Jain', gender: 'male',
    dateOfBirth: new Date('1940-03-15'), dateOfDeath: new Date('2015-08-20'), isAlive: false, gotra: 'Khandelwal',
  });
  const savitri = await createPerson({
    firstName: 'Savitri', lastName: 'Jain', gender: 'female',
    dateOfBirth: new Date('1945-07-10'), dateOfDeath: new Date('2020-01-05'), isAlive: false, gotra: 'Khandelwal',
  });
  // Gen 2
  const suresh = await createPerson({
    firstName: 'Suresh', lastName: 'Jain', gender: 'male',
    dateOfBirth: new Date('1965-11-20'), isAlive: true, gotra: 'Khandelwal',
  });
  const mukesh = await createPerson({
    firstName: 'Mukesh', lastName: 'Jain', gender: 'male',
    dateOfBirth: new Date('1970-06-08'), isAlive: true, gotra: 'Khandelwal',
  });

  // =============================================
  // FAMILY 2: SHARMA (Sunita's maiden family)
  // =============================================
  // Gen 1
  const rajendra = await createPerson({
    firstName: 'Rajendra', lastName: 'Sharma', gender: 'male',
    dateOfBirth: new Date('1938-01-22'), dateOfDeath: new Date('2018-11-10'), isAlive: false,
  });
  const kamla = await createPerson({
    firstName: 'Kamla', lastName: 'Sharma', gender: 'female',
    dateOfBirth: new Date('1942-06-05'), isAlive: true,
  });
  // Gen 2
  const sunita = await createPerson({
    firstName: 'Sunita', lastName: 'Jain', gender: 'female',
    dateOfBirth: new Date('1968-04-12'), isAlive: true, gotra: 'Khandelwal',
  });
  const vikram = await createPerson({
    firstName: 'Vikram', lastName: 'Sharma', gender: 'male',
    dateOfBirth: new Date('1970-09-18'), isAlive: true,
  });
  const pooja = await createPerson({
    firstName: 'Pooja', lastName: 'Sharma', gender: 'female',
    dateOfBirth: new Date('1973-02-14'), isAlive: true,
  });
  // Gen 3 (Sharma side)
  const amit = await createPerson({
    firstName: 'Amit', lastName: 'Sharma', gender: 'male',
    dateOfBirth: new Date('1998-07-25'), isAlive: true,
  });

  // =============================================
  // FAMILY 3: GUPTA (Meena's maiden family)
  // =============================================
  // Gen 1
  const harish = await createPerson({
    firstName: 'Harish', lastName: 'Gupta', gender: 'male',
    dateOfBirth: new Date('1942-04-10'), isAlive: true,
  });
  const sushma = await createPerson({
    firstName: 'Sushma', lastName: 'Gupta', gender: 'female',
    dateOfBirth: new Date('1946-08-30'), dateOfDeath: new Date('2019-05-12'), isAlive: false,
  });
  // Gen 2
  const meena = await createPerson({
    firstName: 'Meena', lastName: 'Jain', gender: 'female',
    dateOfBirth: new Date('1972-09-14'), isAlive: true, gotra: 'Khandelwal',
  });
  const deepak = await createPerson({
    firstName: 'Deepak', lastName: 'Gupta', gender: 'male',
    dateOfBirth: new Date('1975-12-01'), isAlive: true,
  });
  const kavita = await createPerson({
    firstName: 'Kavita', lastName: 'Gupta', gender: 'female',
    dateOfBirth: new Date('1978-03-20'), isAlive: true,
  });
  // Gen 3 (Gupta side)
  const riya = await createPerson({
    firstName: 'Riya', lastName: 'Gupta', gender: 'female',
    dateOfBirth: new Date('2001-11-08'), isAlive: true,
  });

  // =============================================
  // GEN 3: Children of the married couples
  // =============================================
  const rohan = await createPerson({
    firstName: 'Rohan', lastName: 'Jain', gender: 'male',
    dateOfBirth: new Date('1995-01-28'), isAlive: true, gotra: 'Khandelwal',
    claimedByUserId: rohanUser.id,
  });
  const neha = await createPerson({
    firstName: 'Neha', lastName: 'Jain', gender: 'female',
    dateOfBirth: new Date('1998-08-22'), isAlive: true, gotra: 'Khandelwal',
  });
  const arjun = await createPerson({
    firstName: 'Arjun', lastName: 'Jain', gender: 'male',
    dateOfBirth: new Date('1996-12-03'), isAlive: true, gotra: 'Khandelwal',
  });
  const ananya = await createPerson({
    firstName: 'Ananya', lastName: 'Jain', gender: 'female',
    dateOfBirth: new Date('2000-03-19'), isAlive: true, gotra: 'Khandelwal',
  });

  // =============================================
  // FAMILY 4: VERMA (Priya's maiden family — Rohan's wife)
  // =============================================
  const mohan = await createPerson({
    firstName: 'Mohan', lastName: 'Verma', gender: 'male',
    dateOfBirth: new Date('1960-05-15'), isAlive: true,
  });
  const lata = await createPerson({
    firstName: 'Lata', lastName: 'Verma', gender: 'female',
    dateOfBirth: new Date('1963-08-22'), isAlive: true,
  });
  const priya = await createPerson({
    firstName: 'Priya', lastName: 'Jain', gender: 'female',
    dateOfBirth: new Date('1997-05-15'), isAlive: true, gotra: 'Khandelwal',
  });
  const sanjay = await createPerson({
    firstName: 'Sanjay', lastName: 'Verma', gender: 'male',
    dateOfBirth: new Date('1994-03-10'), isAlive: true,
  });
  const rina = await createPerson({
    firstName: 'Rina', lastName: 'Verma', gender: 'female',
    dateOfBirth: new Date('1996-07-28'), isAlive: true,
  });
  const kabir = await createPerson({
    firstName: 'Kabir', lastName: 'Verma', gender: 'male',
    dateOfBirth: new Date('2022-01-14'), isAlive: true,
  });

  // =============================================
  // FAMILY 5: AGARWAL (Nisha's maiden family — Arjun's wife)
  // =============================================
  const vinod = await createPerson({
    firstName: 'Vinod', lastName: 'Agarwal', gender: 'male',
    dateOfBirth: new Date('1962-11-05'), dateOfDeath: new Date('2020-09-18'), isAlive: false,
  });
  const rekha = await createPerson({
    firstName: 'Rekha', lastName: 'Agarwal', gender: 'female',
    dateOfBirth: new Date('1965-02-20'), isAlive: true,
  });
  const nisha = await createPerson({
    firstName: 'Nisha', lastName: 'Jain', gender: 'female',
    dateOfBirth: new Date('1998-06-12'), isAlive: true, gotra: 'Khandelwal',
  });
  const manish = await createPerson({
    firstName: 'Manish', lastName: 'Agarwal', gender: 'male',
    dateOfBirth: new Date('1995-04-30'), isAlive: true,
  });

  // =============================================
  // FAMILY 6: MEHTA (Rahul's family — Ananya's husband)
  // =============================================
  const prakash = await createPerson({
    firstName: 'Prakash', lastName: 'Mehta', gender: 'male',
    dateOfBirth: new Date('1968-07-14'), isAlive: true,
  });
  const geeta = await createPerson({
    firstName: 'Geeta', lastName: 'Mehta', gender: 'female',
    dateOfBirth: new Date('1970-10-25'), isAlive: true,
  });
  const rahul = await createPerson({
    firstName: 'Rahul', lastName: 'Mehta', gender: 'male',
    dateOfBirth: new Date('1998-09-08'), isAlive: true,
  });
  const sneha = await createPerson({
    firstName: 'Sneha', lastName: 'Mehta', gender: 'female',
    dateOfBirth: new Date('2002-12-17'), isAlive: true,
  });

  // =============================================
  // GEN 4: Children of gen-3 couples
  // =============================================
  const aarav = await createPerson({
    firstName: 'Aarav', lastName: 'Jain', gender: 'male',
    dateOfBirth: new Date('2024-06-10'), isAlive: true, gotra: 'Khandelwal',
  });
  const ishaan = await createPerson({
    firstName: 'Ishaan', lastName: 'Jain', gender: 'male',
    dateOfBirth: new Date('2025-02-20'), isAlive: true, gotra: 'Khandelwal',
  });

  console.log('36 persons created across 6 families');

  // =============================================
  // RELATIONSHIPS
  // =============================================
  const rels = [
    // --- JAIN FAMILY ---
    { p1: ramesh.id, p2: savitri.id, type: 'spouse' as const },
    { p1: ramesh.id, p2: suresh.id, type: 'parent_child' as const },
    { p1: savitri.id, p2: suresh.id, type: 'parent_child' as const },
    { p1: ramesh.id, p2: mukesh.id, type: 'parent_child' as const },
    { p1: savitri.id, p2: mukesh.id, type: 'parent_child' as const },

    // --- SHARMA FAMILY ---
    { p1: rajendra.id, p2: kamla.id, type: 'spouse' as const },
    { p1: rajendra.id, p2: sunita.id, type: 'parent_child' as const },
    { p1: kamla.id, p2: sunita.id, type: 'parent_child' as const },
    { p1: rajendra.id, p2: vikram.id, type: 'parent_child' as const },
    { p1: kamla.id, p2: vikram.id, type: 'parent_child' as const },
    { p1: vikram.id, p2: pooja.id, type: 'spouse' as const },
    { p1: vikram.id, p2: amit.id, type: 'parent_child' as const },
    { p1: pooja.id, p2: amit.id, type: 'parent_child' as const },

    // --- GUPTA FAMILY ---
    { p1: harish.id, p2: sushma.id, type: 'spouse' as const },
    { p1: harish.id, p2: meena.id, type: 'parent_child' as const },
    { p1: sushma.id, p2: meena.id, type: 'parent_child' as const },
    { p1: harish.id, p2: deepak.id, type: 'parent_child' as const },
    { p1: sushma.id, p2: deepak.id, type: 'parent_child' as const },
    { p1: deepak.id, p2: kavita.id, type: 'spouse' as const },
    { p1: deepak.id, p2: riya.id, type: 'parent_child' as const },
    { p1: kavita.id, p2: riya.id, type: 'parent_child' as const },

    // --- VERMA FAMILY ---
    { p1: mohan.id, p2: lata.id, type: 'spouse' as const },
    { p1: mohan.id, p2: priya.id, type: 'parent_child' as const },
    { p1: lata.id, p2: priya.id, type: 'parent_child' as const },
    { p1: mohan.id, p2: sanjay.id, type: 'parent_child' as const },
    { p1: lata.id, p2: sanjay.id, type: 'parent_child' as const },
    { p1: sanjay.id, p2: rina.id, type: 'spouse' as const },
    { p1: sanjay.id, p2: kabir.id, type: 'parent_child' as const },
    { p1: rina.id, p2: kabir.id, type: 'parent_child' as const },

    // --- AGARWAL FAMILY ---
    { p1: vinod.id, p2: rekha.id, type: 'spouse' as const },
    { p1: vinod.id, p2: nisha.id, type: 'parent_child' as const },
    { p1: rekha.id, p2: nisha.id, type: 'parent_child' as const },
    { p1: vinod.id, p2: manish.id, type: 'parent_child' as const },
    { p1: rekha.id, p2: manish.id, type: 'parent_child' as const },

    // --- MEHTA FAMILY ---
    { p1: prakash.id, p2: geeta.id, type: 'spouse' as const },
    { p1: prakash.id, p2: rahul.id, type: 'parent_child' as const },
    { p1: geeta.id, p2: rahul.id, type: 'parent_child' as const },
    { p1: prakash.id, p2: sneha.id, type: 'parent_child' as const },
    { p1: geeta.id, p2: sneha.id, type: 'parent_child' as const },

    // --- MARRIAGES connecting families (Gen 2) ---
    { p1: suresh.id, p2: sunita.id, type: 'spouse' as const },
    { p1: mukesh.id, p2: meena.id, type: 'spouse' as const },

    // --- MARRIAGES connecting families (Gen 3) ---
    { p1: rohan.id, p2: priya.id, type: 'spouse' as const },
    { p1: arjun.id, p2: nisha.id, type: 'spouse' as const },
    { p1: rahul.id, p2: ananya.id, type: 'spouse' as const },

    // --- CHILDREN of Suresh + Sunita ---
    { p1: suresh.id, p2: rohan.id, type: 'parent_child' as const },
    { p1: sunita.id, p2: rohan.id, type: 'parent_child' as const },
    { p1: suresh.id, p2: neha.id, type: 'parent_child' as const },
    { p1: sunita.id, p2: neha.id, type: 'parent_child' as const },

    // --- CHILDREN of Mukesh + Meena ---
    { p1: mukesh.id, p2: arjun.id, type: 'parent_child' as const },
    { p1: meena.id, p2: arjun.id, type: 'parent_child' as const },
    { p1: mukesh.id, p2: ananya.id, type: 'parent_child' as const },
    { p1: meena.id, p2: ananya.id, type: 'parent_child' as const },

    // --- GEN 4 children ---
    { p1: rohan.id, p2: aarav.id, type: 'parent_child' as const },
    { p1: priya.id, p2: aarav.id, type: 'parent_child' as const },
    { p1: arjun.id, p2: ishaan.id, type: 'parent_child' as const },
    { p1: nisha.id, p2: ishaan.id, type: 'parent_child' as const },
  ];

  for (const rel of rels) {
    await db.insert(relationships).values({
      treeId: tree.id,
      personId1: rel.p1,
      personId2: rel.p2,
      relationshipType: rel.type,
    });
  }

  console.log(`${rels.length} relationships created`);

  console.log('\n--- Six Families Connected Through Marriage ---');
  console.log('');
  console.log('1. JAIN: Ramesh+Savitri → Suresh, Mukesh');
  console.log('2. SHARMA: Rajendra+Kamla → Sunita (→Suresh), Vikram+Pooja → Amit');
  console.log('3. GUPTA: Harish+Sushma → Meena (→Mukesh), Deepak+Kavita → Riya');
  console.log('4. VERMA: Mohan+Lata → Priya (→Rohan), Sanjay+Rina → Kabir');
  console.log('5. AGARWAL: Vinod+Rekha → Nisha (→Arjun), Manish');
  console.log('6. MEHTA: Prakash+Geeta → Rahul (→Ananya), Sneha');
  console.log('');
  console.log('Gen 3 children: Rohan+Priya→Aarav, Arjun+Nisha→Ishaan');
  console.log('Rahul+Ananya (no children yet)');
  console.log('\nLogin: rohan@vansh.app / rohan123 | Slug: jain-family-demo');
  console.log('\nSeeding complete!');
  process.exit(0);
}

seedFamily().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
