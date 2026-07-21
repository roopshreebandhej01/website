import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { mediaOwnerTypeEnum, productStatusEnum } from './enums'
import { users } from './users'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}



export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 180 }).notNull(),
    description: text('description'),
    bannerImage: text('banner_image'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('categories_slug_idx').on(table.slug),
    index('categories_parent_id_idx').on(table.parentId),
  ],
)

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 80 }).notNull(),
    slug: varchar('slug', { length: 180 }).notNull(),
    name: varchar('name', { length: 220 }).notNull(),
    shortDescription: text('short_description'),
    description: text('description'),
    basePrice: integer('base_price').notNull(),
    strikeThroughPrice: integer('strike_through_price'),
    status: productStatusEnum('status').default('draft').notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    isNewArrival: boolean('is_new_arrival').default(false).notNull(),
    isTrending: boolean('is_trending').default(false).notNull(),
    rating: integer('rating').default(0).notNull(),
    reviewCount: integer('review_count').default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('products_sku_idx').on(table.sku),
    uniqueIndex('products_slug_idx').on(table.slug),
    index('products_name_idx').on(table.name),
    index('products_status_idx').on(table.status),
  ],
)

export const productCategories = pgTable(
  'product_categories',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index('product_categories_category_id_idx').on(table.categoryId),
  ],
)

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 80 }).notNull(),
    instagramLink: varchar("instagram_link"),
    title: varchar('title', { length: 180 }).notNull(),
    price: integer('price').notNull(),
    strikeThroughPrice: integer('strike_through_price'),
    stockQuantity: integer('stock_quantity').default(0).notNull(),
    hasVariantBox: boolean('has_variant_box').default(false).notNull(),
    size: varchar('size', { length: 80 }),
    color: varchar('color', { length: 80 }),
    fabric: varchar('fabric', { length: 120 }),
    bannerImage: text('banner_image'),
    isDefault: boolean('is_default').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    index('product_variants_sku_idx').on(table.sku),
    index('product_variants_product_id_idx').on(table.productId),
  ],
)

export const productAttributes = pgTable(
  'product_attributes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    value: text('value').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => [index('product_attributes_product_id_idx').on(table.productId)],
)


export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(),
    bucket: varchar('bucket', { length: 120 }),
    contentType: varchar('content_type', { length: 120 }).notNull(),
    sizeInBytes: integer('size_in_bytes'),
    width: integer('width'),
    height: integer('height'),
    altText: varchar('alt_text', { length: 255 }),
    ownerType: mediaOwnerTypeEnum('owner_type').notNull(),
    uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('media_assets_key_idx').on(table.key),
    index('media_assets_owner_type_idx').on(table.ownerType),
  ],
)

export const productMedia = pgTable(
  'product_media',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, {
        onDelete: 'cascade',
      }),
    sortOrder: integer('sort_order').default(0).notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.variantId, table.mediaAssetId] }),
    index('product_media_product_id_idx').on(table.productId),
    index('product_media_product_variant_idx').on(table.productId, table.variantId),
    index('product_media_variant_id_idx').on(table.variantId),
  ],
)

export const productFilters = pgTable(
  'product_filters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    value: varchar('value', { length: 160 }).notNull(),
  },
  (table) => [
    index('product_filters_product_id_idx').on(table.productId),
    index('product_filters_name_value_idx').on(table.name, table.value),
  ],
)
