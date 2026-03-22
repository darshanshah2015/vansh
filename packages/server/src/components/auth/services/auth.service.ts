import { eq, and, gte, isNull } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from '@db/index';
import { users, sessions, passwordResetTokens } from '@db/schema/index';
import { EmailAlreadyExistsError, InvalidCredentialsError, InvalidResetTokenError } from '../errors/auth.errors';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 hour
const SALT_ROUNDS = 12;

export async function signup(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, data.email.toLowerCase()),
  });
  if (existing) throw new EmailAlreadyExistsError(data.email);

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    })
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      verificationStatus: users.verificationStatus,
    });

  const sessionToken = crypto.randomBytes(32).toString('hex');
  await db.insert(sessions).values({
    userId: user.id,
    token: sessionToken,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  });

  return { user, sessionToken };
}

export async function login(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: and(eq(users.email, email.toLowerCase()), eq(users.isActive, true)),
  });
  if (!user) throw new InvalidCredentialsError();

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new InvalidCredentialsError();

  const sessionToken = crypto.randomBytes(32).toString('hex');
  await db.insert(sessions).values({
    userId: user.id,
    token: sessionToken,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  });

  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      verificationStatus: user.verificationStatus,
    },
    sessionToken,
  };
}

export async function logout(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function getCurrentUser(userId: string) {
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
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user;
}

export async function createResetToken(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  // Don't reveal if email exists
  if (!user) return { token: null };

  const token = crypto.randomBytes(32).toString('hex');
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
  });

  return { token };
}

export async function resetPassword(token: string, newPassword: string) {
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gte(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .limit(1);

  if (!resetToken) throw new InvalidResetTokenError();

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id));
}
