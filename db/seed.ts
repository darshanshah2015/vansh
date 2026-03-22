import { db } from './index';
import { users } from './schema/index';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('Seeding database...');

  const existing = await db.query.users.findFirst({
    where: eq(users.email, 'admin@vansh.app'),
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await db.insert(users).values({
      email: 'admin@vansh.app',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      verificationStatus: 'verified',
    });
    console.log('Admin user created: admin@vansh.app / admin123');
  } else {
    console.log('Admin user already exists');
  }

  console.log('Seeding complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
