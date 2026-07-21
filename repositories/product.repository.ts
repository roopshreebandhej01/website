import { and, asc, countDistinct, desc, eq, ilike, inArray, ne, or, sql, type SQL } from 'drizzle-orm'
import {
  categories,
  mediaAssets,
  productCategories,
  productAttributes,
  productMedia,
  products,
  productFilters,
  productVariants,
  reviews,
} from '@/db'
import { db } from '@/lib/db'
import type { ProductPayload } from '@/validators/product.validator'

type ProductRecord = ProductPayload & {
  id: string
  priceInPaise: number
}

export async function createProductRecord(
  payload: ProductPayload & { priceInPaise: number },
): Promise<ProductRecord> {
  void db
  void payload

  // Replace with a Drizzle insert once product schema is available.
  throw new Error('Product create query not implemented')
}

export async function findProductById(
  productId: string,
): Promise<ProductRecord | null> {
  void db
  void productId

  // Replace with a Drizzle select by id.
  return null satisfies ProductRecord | null
}

export async function updateProductRecord(
  productId: string,
  payload: ProductPayload & { priceInPaise: number },
): Promise<ProductRecord> {
  void db
  void productId
  void payload

  // Replace with a Drizzle update by id.
  throw new Error('Product update query not implemented')
}

export type ProductListQuery = {
  limit?: number
  offset?: number
  categorySlug?: string
  categorySlugs?: string[]
  colors?: string[]
  fabrics?: string[]
  sizes?: string[]
  availability?: ('in-stock' | 'out-of-stock')[]
  minPriceInPaise?: number
  maxPriceInPaise?: number
  filters?: Record<string, string[]>
  featured?: boolean
  newArrival?: boolean
  trending?: boolean
  sortBy?: 'featured' | 'newest' | 'price-low' | 'price-high'
}

export type ProductListRow = {
  id: string
  slug: string
  name: string
  sku: string
  basePrice: number
  strikeThroughPrice: number | null
  rating: number
  reviewCount: number
  variantId: string | null
  variantTitle: string | null
  variantPrice: number | null
  variantStrikeThroughPrice: number | null
  stockQuantity: number | null
  color: string | null
  variantBannerImage: string | null
  imageKey: string | null
  imageAlt: string | null
  isFeatured: boolean
  isNewArrival: boolean
  isTrending: boolean
}

export type CategoryListRow = {
  id: string
  name: string
  slug: string
  imageKey: string | null
}

export type CatalogSearchProductRow = ProductListRow

export type CatalogSearchCategoryRow = CategoryListRow

export type ProductFilterOptionRow = {
  name: string
  value: string
}

export type VariantFilterOptionRow = {
  color: string | null
  fabric: string | null
  size: string | null
}

export type ProductPriceRangeRow = {
  minPrice: number | null
  maxPrice: number | null
}

export type ProductDetailRow = {
  id: string
  slug: string
  name: string
  sku: string
  shortDescription: string | null
  description: string | null
  basePrice: number
  strikeThroughPrice: number | null
}

export type ProductDetailVariantRow = {
  id: string
  title: string
  sku: string
  instagramLink: string | null
  price: number
  strikeThroughPrice: number | null
  stockQuantity: number
  color: string | null
  fabric: string | null
  size: string | null
  bannerImage: string | null
  isDefault: boolean
}

export type ProductDetailMediaRow = {
  id: string
  key: string
  altText: string | null
  variantId: string
  isPrimary: boolean
  sortOrder: number
}

export type ProductDetailAttributeRow = {
  id: string
  name: string
  value: string
  sortOrder: number
}

export type ProductReviewRow = {
  id: string
  rating: number
  title: string | null
  message: string
  reviewerName: string | null
  createdAt: Date
}

function getProductWhere(query: ProductListQuery) {
  const categorySlugs = [
    ...(query.categorySlug ? [query.categorySlug] : []),
    ...(query.categorySlugs ?? []),
  ].filter(Boolean)
  const customFilterEntries = Object.entries(query.filters ?? {}).filter(
    ([, values]) => values.length > 0,
  )
  const hasPriceFilter =
    query.minPriceInPaise !== undefined || query.maxPriceInPaise !== undefined
  const activeVariantWhere = and(
    eq(productVariants.productId, products.id),
    eq(productVariants.isActive, true),
  )
  const displayPriceFilters: (SQL | undefined)[] = [
    query.minPriceInPaise === undefined
      ? undefined
      : sql`coalesce(${productVariants.price}, ${products.basePrice}) >= ${query.minPriceInPaise}`,
    query.maxPriceInPaise === undefined
      ? undefined
      : sql`coalesce(${productVariants.price}, ${products.basePrice}) <= ${query.maxPriceInPaise}`,
  ]
  const variantFilters: (SQL | undefined)[] = [
    activeVariantWhere,
    query.colors?.length ? inArray(sql`lower(${productVariants.color})`, query.colors.map(c => c.toLowerCase())) : undefined,
    query.fabrics?.length ? inArray(sql`lower(${productVariants.fabric})`, query.fabrics.map(f => f.toLowerCase())) : undefined,
    query.sizes?.length ? inArray(sql`lower(${productVariants.size})`, query.sizes.map(s => s.toLowerCase())) : undefined,
    query.availability?.length === 1 && query.availability[0] === 'in-stock'
      ? sql`${productVariants.stockQuantity} > 0`
      : undefined,
    query.availability?.length === 1 && query.availability[0] === 'out-of-stock'
      ? eq(productVariants.stockQuantity, 0)
      : undefined,
  ]
  const hasVariantAttributeFilters = Boolean(
    query.colors?.length ||
      query.fabrics?.length ||
      query.sizes?.length ||
      query.availability?.length === 1,
  )
  const conditions: (SQL | undefined)[] = [
    ne(products.status, 'archived'),
    query.featured === undefined
      ? undefined
      : eq(products.isFeatured, query.featured),
    query.newArrival === undefined
      ? undefined
      : eq(products.isNewArrival, query.newArrival),
    query.trending === undefined
      ? undefined
      : eq(products.isTrending, query.trending),
    categorySlugs.length
      ? sql`exists (
          select 1 from ${productCategories}
          inner join ${categories} on ${categories.id} = ${productCategories.categoryId}
          where ${productCategories.productId} = ${products.id}
          and ${inArray(categories.slug, categorySlugs)}
        )`
      : undefined,
    hasVariantAttributeFilters
      ? sql`exists (
          select 1 from ${productVariants}
          where ${and(...variantFilters)}
        )`
      : undefined,
    hasPriceFilter ? and(...displayPriceFilters) : undefined,
    ...customFilterEntries.map(([name, values]) => sql`exists (
      select 1 from ${productFilters}
      where ${productFilters.productId} = ${products.id}
      and lower(${productFilters.name}) = lower(${name})
      and ${inArray(productFilters.value, values)}
    )`),
  ]

  return and(...conditions)
}

function getProductOrder(query: ProductListQuery) {
  if (query.sortBy === 'price-low') {
    return asc(sql`coalesce(${productVariants.price}, ${products.basePrice})`)
  }

  if (query.sortBy === 'price-high') {
    return desc(sql`coalesce(${productVariants.price}, ${products.basePrice})`)
  }

  if (query.sortBy === 'newest') {
    return desc(products.createdAt)
  }

  return desc(products.isFeatured)
}

export async function listProductRows(
  query: ProductListQuery = {},
): Promise<ProductListRow[]> {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      sku: products.sku,
      basePrice: products.basePrice,
      strikeThroughPrice: products.strikeThroughPrice,
      rating: products.rating,
      reviewCount: products.reviewCount,
      variantId: productVariants.id,
      variantTitle: productVariants.title,
      variantPrice: productVariants.price,
      variantStrikeThroughPrice: productVariants.strikeThroughPrice,
      stockQuantity: productVariants.stockQuantity,
      color: productVariants.color,
      variantBannerImage: productVariants.bannerImage,
      imageKey: mediaAssets.key,
      imageAlt: mediaAssets.altText,
      isFeatured: products.isFeatured,
      isNewArrival: products.isNewArrival,
      isTrending: products.isTrending,
    })
    .from(products)
    .leftJoin(
      productVariants,
      and(
        eq(productVariants.productId, products.id),
        eq(productVariants.isDefault, true),
        eq(productVariants.isActive, true),
      ),
    )
    .leftJoin(
      productMedia,
      and(
        eq(productMedia.productId, products.id),
        eq(productMedia.variantId, productVariants.id),
        eq(productMedia.isPrimary, true),
      ),
    )
    .leftJoin(mediaAssets, eq(mediaAssets.id, productMedia.mediaAssetId))
    .where(getProductWhere(query))
    .orderBy(getProductOrder(query), asc(products.name), asc(products.id))
    .limit(query.limit ?? 12)
    .offset(query.offset ?? 0)
}

export async function countProductRows(query: ProductListQuery = {}) {
  const [row] = await db
    .select({ count: countDistinct(products.id) })
    .from(products)
    .leftJoin(
      productVariants,
      and(
        eq(productVariants.productId, products.id),
        eq(productVariants.isDefault, true),
        eq(productVariants.isActive, true),
      ),
    )
    .where(getProductWhere(query))

  return row?.count ?? 0
}

export async function listCategoryRows(limit = 12): Promise<CategoryListRow[]> {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      imageKey: categories.bannerImage,
    })
    .from(categories)
    .orderBy(asc(categories.name))
    .limit(limit)
}

export async function searchProductRows(
  term: string,
  limit = 5,
): Promise<CatalogSearchProductRow[]> {
  const search = `%${term.trim()}%`

  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      sku: products.sku,
      basePrice: products.basePrice,
      strikeThroughPrice: products.strikeThroughPrice,
      rating: products.rating,
      reviewCount: products.reviewCount,
      variantId: productVariants.id,
      variantTitle: productVariants.title,
      variantPrice: productVariants.price,
      variantStrikeThroughPrice: productVariants.strikeThroughPrice,
      stockQuantity: productVariants.stockQuantity,
      color: productVariants.color,
      variantBannerImage: productVariants.bannerImage,
      imageKey: mediaAssets.key,
      imageAlt: mediaAssets.altText,
      isFeatured: products.isFeatured,
      isNewArrival: products.isNewArrival,
      isTrending: products.isTrending,
    })
    .from(products)
    .leftJoin(
      productVariants,
      and(
        eq(productVariants.productId, products.id),
        eq(productVariants.isDefault, true),
        eq(productVariants.isActive, true),
      ),
    )
    .leftJoin(
      productMedia,
      and(
        eq(productMedia.productId, products.id),
        eq(productMedia.variantId, productVariants.id),
        eq(productMedia.isPrimary, true),
      ),
    )
    .leftJoin(mediaAssets, eq(mediaAssets.id, productMedia.mediaAssetId))
    .where(
      and(
        ne(products.status, 'archived'),
        or(
          ilike(products.name, search),
          ilike(products.slug, search),
          ilike(products.sku, search),
          ilike(productVariants.title, search),
          ilike(productVariants.sku, search),
          sql`exists (
            select 1 from ${productCategories}
            inner join ${categories} on ${categories.id} = ${productCategories.categoryId}
            where ${productCategories.productId} = ${products.id}
            and (${ilike(categories.name, search)} or ${ilike(categories.slug, search)})
          )`,
        ),
      ),
    )
    .orderBy(desc(products.isFeatured), asc(products.name), asc(products.id))
    .limit(limit)
}

export async function searchCategoryRows(
  term: string,
  limit = 4,
): Promise<CatalogSearchCategoryRow[]> {
  const search = `%${term.trim()}%`

  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      imageKey: categories.bannerImage,
    })
    .from(categories)
    .where(or(ilike(categories.name, search), ilike(categories.slug, search)))
    .orderBy(asc(categories.name))
    .limit(limit)
}

export async function listVariantFilterOptionRows(): Promise<VariantFilterOptionRow[]> {
  return db
    .select({
      color: productVariants.color,
      fabric: productVariants.fabric,
      size: productVariants.size,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(eq(productVariants.isActive, true), ne(products.status, 'archived')))
    .groupBy(productVariants.color, productVariants.fabric, productVariants.size)
}

export async function listCatalogProductFilterOptionRows(): Promise<ProductFilterOptionRow[]> {
  return db
    .select({
      name: productFilters.name,
      value: productFilters.value,
    })
    .from(productFilters)
    .innerJoin(products, eq(products.id, productFilters.productId))
    .where(ne(products.status, 'archived'))
    .groupBy(productFilters.name, productFilters.value)
    .orderBy(productFilters.name, productFilters.value)
}

export async function getCatalogProductPriceRange(): Promise<ProductPriceRangeRow> {
  const [range] = await db
    .select({
      minPrice: sql<number>`min(coalesce(${productVariants.price}, ${products.basePrice}))`,
      maxPrice: sql<number>`max(coalesce(${productVariants.price}, ${products.basePrice}))`,
    })
    .from(products)
    .leftJoin(
      productVariants,
      and(
        eq(productVariants.productId, products.id),
        eq(productVariants.isActive, true),
      ),
    )
    .where(ne(products.status, 'archived'))

  return range ?? { minPrice: null, maxPrice: null }
}

export async function findProductDetailBySlug(slug: string) {
  const [product] = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      sku: products.sku,
      shortDescription: products.shortDescription,
      description: products.description,
      basePrice: products.basePrice,
      strikeThroughPrice: products.strikeThroughPrice,
    })
    .from(products)
    .where(and(eq(products.slug, slug), ne(products.status, 'archived')))
    .limit(1)

  return product ?? null
}

export async function listProductDetailVariants(
  productId: string,
): Promise<ProductDetailVariantRow[]> {
  return db
    .select({
      id: productVariants.id,
      title: productVariants.title,
      sku: productVariants.sku,
      instagramLink: productVariants.instagramLink,
      price: productVariants.price,
      strikeThroughPrice: productVariants.strikeThroughPrice,
      stockQuantity: productVariants.stockQuantity,
      color: productVariants.color,
      fabric: productVariants.fabric,
      size: productVariants.size,
      bannerImage: productVariants.bannerImage,
      isDefault: productVariants.isDefault,
    })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.productId, productId),
        eq(productVariants.isActive, true),
      ),
    )
    .orderBy(desc(productVariants.isDefault), asc(productVariants.title))
}

export async function listProductDetailMedia(
  productId: string,
): Promise<ProductDetailMediaRow[]> {
  return db
    .select({
      id: mediaAssets.id,
      key: mediaAssets.key,
      altText: mediaAssets.altText,
      variantId: productMedia.variantId,
      isPrimary: productMedia.isPrimary,
      sortOrder: productMedia.sortOrder,
    })
    .from(productMedia)
    .innerJoin(mediaAssets, eq(mediaAssets.id, productMedia.mediaAssetId))
    .where(eq(productMedia.productId, productId))
    .orderBy(desc(productMedia.isPrimary), asc(productMedia.sortOrder))
}

export async function listProductDetailAttributes(
  productId: string,
): Promise<ProductDetailAttributeRow[]> {
  return db
    .select({
      id: productAttributes.id,
      name: productAttributes.name,
      value: productAttributes.value,
      sortOrder: productAttributes.sortOrder,
    })
    .from(productAttributes)
    .where(eq(productAttributes.productId, productId))
    .orderBy(asc(productAttributes.sortOrder), asc(productAttributes.name))
}

export async function listProductReviews(productId: string): Promise<ProductReviewRow[]> {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      message: reviews.message,
      reviewerName: reviews.reviewerName,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.productId, productId),
        sql`${reviews.status}::text in ('accepted', 'approved')`,
      ),
    )
    .orderBy(desc(reviews.createdAt))
}
