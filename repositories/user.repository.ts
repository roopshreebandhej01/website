import { db } from '@/lib/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import type { ProfilePayload } from '@/validators/profile.validator'

type UserRecord = {
  id: string
  email: string
  role: 'user' | 'admin'
}

export async function listUsers(): Promise<UserRecord[]> {
  void db

  // Replace with a Drizzle select from users.
  return [] satisfies UserRecord[]
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  void db
  void userId

  // Replace with a Drizzle select by id.
  return null satisfies UserRecord | null
}

export async function findUserByEmail(email: string) {
  const [profile] = await db.select().from(users).where(eq(users.email, email))

  return profile ?? null
}

export async function upsertUserProfileByEmail({
  email,
  cognitoSub,
  payload,
}: {
  email: string
  cognitoSub?: string
  payload: ProfilePayload
}) {
  const existing = await findUserByEmail(email)

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        name: payload.fullName,
        phone: payload.phone,
        secondPhone: payload.secondPhone ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email))
      .returning()

    return updated
  }

  if (!cognitoSub) {
    return null
  }

  const [created] = await db
    .insert(users)
    .values({
      cognitoSub,
      email,
      name: payload.fullName,
      phone: payload.phone,
      secondPhone: payload.secondPhone ?? null,
      emailVerified: true,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: payload.fullName,
        phone: payload.phone,
        secondPhone: payload.secondPhone ?? null,
        updatedAt: new Date(),
      },
    })
    .returning()

  return created
}

export async function upsertUserFromAuthClaims({
  email,
  cognitoSub,
  name,
  phone,
}: {
  email: string
  cognitoSub: string
  name?: string
  phone?: string
}) {
  const existing = await findUserByEmail(email)
  const profileName = name?.trim() || email.split('@')[0]

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        cognitoSub: existing.cognitoSub || cognitoSub,
        name: name?.trim() || existing.name,
        phone: phone ?? existing.phone,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email))
      .returning()

    return updated
  }

  const [profile] = await db
    .insert(users)
    .values({
      cognitoSub,
      email,
      name: profileName,
      phone: phone || null,
      emailVerified: true,
    })
    .onConflictDoNothing()
    .returning()

  return profile ?? findUserByEmail(email)
}
