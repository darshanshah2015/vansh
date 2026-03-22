import { eq, and, ilike, or, count } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '@db/index';
import { users } from '@db/schema/index';
import { NotFoundError, ValidationError } from '../../../shared/errors/index';

const SALT_ROUNDS = 12;

export async function getProfile(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      role: users.role,
      verificationStatus: users.verificationStatus,
      isActive: users.isActive,
      lastActiveAt: users.lastActiveAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new NotFoundError('User', userId);
  return user;
}

export async function updateProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; email?: string; phone?: string | null }
) {
  const [updated] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      role: users.role,
      verificationStatus: users.verificationStatus,
    });

  if (!updated) throw new NotFoundError('User', userId);
  return updated;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) throw new NotFoundError('User', userId);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new ValidationError('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function getUserById(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      role: users.role,
      verificationStatus: users.verificationStatus,
      isActive: users.isActive,
      lastActiveAt: users.lastActiveAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new NotFoundError('User', userId);
  return user;
}

export async function listUsers(params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  verificationStatus?: string;
}) {
  const { page, limit, search, role, verificationStatus } = params;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    );
  }
  if (role) conditions.push(eq(users.role, role as 'user' | 'admin'));
  if (verificationStatus) {
    conditions.push(
      eq(users.verificationStatus, verificationStatus as 'unverified' | 'pending' | 'verified' | 'rejected')
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        verificationStatus: users.verificationStatus,
        isActive: users.isActive,
        lastActiveAt: users.lastActiveAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(users.createdAt),
    db
      .select({ total: count() })
      .from(users)
      .where(where),
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

export async function uploadAadhaar(userId: string, fileKey: string) {
  await db
    .update(users)
    .set({ aadhaarPhotoKey: fileKey, verificationStatus: 'pending' })
    .where(eq(users.id, userId));
}

export async function getAadhaarPhotoKey(userId: string): Promise<string | null> {
  const [user] = await db
    .select({ aadhaarPhotoKey: users.aadhaarPhotoKey })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new NotFoundError('User', userId);
  return user.aadhaarPhotoKey ?? null;
}
