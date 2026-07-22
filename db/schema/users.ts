import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { customerContactTypeEnum, userRoleEnum } from './enums'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cognitoSub: varchar('cognito_sub', { length: 128 }),
    name: varchar('name', { length: 160 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    role: userRoleEnum('role').default('user').notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('users_cognito_sub_idx').on(table.cognitoSub),
    uniqueIndex('users_email_idx').on(table.email),
    index('users_role_idx').on(table.role),
  ],
)

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: varchar('full_name', { length: 160 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    line1: text('line_1').notNull(),
    line2: text('line_2'),
    locality: varchar('locality', { length: 160 }),
    city: varchar('city', { length: 120 }).notNull(),
    state: varchar('state', { length: 120 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 80 }).default('India').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    index('addresses_user_id_idx').on(table.userId),
    index('addresses_default_idx').on(table.userId, table.isDefault),
  ],
)

export const customerContacts = pgTable(
  'customer_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    type: customerContactTypeEnum('type').notNull(),

    fullName: varchar('full_name', { length: 160 }),
    phone: varchar('phone', { length: 20 }),
    category: varchar('category', { length: 120 }),
    subject: varchar('subject', { length: 180 }),
    message: text('message'),

    ...timestamps,
  },
  (table) => [
    index('customer_contacts_type_idx').on(table.type),
    index('customer_contacts_email_idx').on(table.email),
  ],
)

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('subscriptions_email_idx').on(table.email),
  ]
)