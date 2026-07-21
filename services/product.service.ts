import {
  createProductRecord,
  findProductById,
  findProductDetailBySlug,
  listCategoryRows,
  listProductDetailAttributes,
  listProductDetailMedia,
  listProductReviews,
  listProductDetailVariants,
  listProductRows,
  countProductRows,
  getCatalogProductPriceRange,
  listCatalogProductFilterOptionRows,
  updateProductRecord,
  listVariantFilterOptionRows,
  searchCategoryRows,
  searchProductRows,
  type ProductListQuery,
  type ProductListRow,
} from '@/repositories/product.repository'
import { unstable_cache } from 'next/cache'
import { getS3ObjectPreviewUrl } from '@/lib/s3'
import type { ProductPayload } from '@/validators/product.validator'
import { listReviewMediaRows } from '@/repositories/review.repository'

export const CATALOG_CATEGORIES_CACHE_TAG = 'catalog-categories'
const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'

const getCachedCategoryRows = unstable_cache(
  async (limit: number) => listCategoryRows(limit),
  ['catalog-categories'],
  {
    revalidate: 300,
    tags: [CATALOG_CATEGORIES_CACHE_TAG],
  },
)

export async function createProduct(payload: ProductPayload) {
  const priceInPaise = Math.round(payload.price * 100)

  return createProductRecord({
    ...payload,
    priceInPaise,
  })
}

export async function updateProduct(productId: string, payload: ProductPayload) {
  const product = await findProductById(productId)

  if (!product) {
    throw new Error('Product not found')
  }

  return updateProductRecord(productId, {
    ...payload,
    priceInPaise: Math.round(payload.price * 100),
  })
}

function mapProductRow(row: ProductListRow) {
  const imageKey = row.imageKey ?? row.variantBannerImage
  const image = imageKey ? getS3ObjectPreviewUrl(imageKey) : ''
  const price = (row.variantPrice ?? row.basePrice) / 100

  return {
    id: row.id,
    variantId: row.variantId,
    slug: row.slug,
    name: row.name,
    colour: row.color ?? '',
    price,
    stockQuantity: row.stockQuantity ?? undefined,
    rating: row.rating / 100,
    reviewCount: row.reviewCount,
    image,
    imageClass: 'object-top',
    isFeatured: row.isFeatured,
    isNewArrival: row.isNewArrival,
    isTrending: row.isTrending,
  }
}

export async function getCatalogProducts(query: ProductListQuery = {}) {
  const rows = await listProductRows(query)

  return rows.map(mapProductRow)
}

export async function getCatalogProductPage(query: ProductListQuery = {}) {
  const [items, total] = await Promise.all([
    getCatalogProducts(query),
    countProductRows(query),
  ])

  return {
    items,
    total,
  }
}

export async function getFeaturedProducts(limit = 5) {
  return getCatalogProducts({
    featured: true,
    limit,
    sortBy: 'featured',
  })
}

export async function getRecommendedProducts(limit = 5) {
  return getCatalogProducts({
    limit,
    sortBy: 'newest',
  })
}

export async function getNewArrivalProducts(limit = 5) {
  return getCatalogProducts({
    newArrival: true,
    limit,
    sortBy: 'newest',
  })
}

export async function getTrendingProducts(limit = 5) {
  return getCatalogProducts({
    trending: true,
    limit,
    sortBy: 'newest',
  })
}

export async function getCatalogCategories(limit = 8) {
  if (isProductionBuild) {
    return []
  }

  const rows = await getCachedCategoryRows(limit)

  return rows.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    href: `/shop?category=${category.slug}`,
    image: category.imageKey ? getS3ObjectPreviewUrl(category.imageKey) : '',
  }))
}

export async function searchCatalog(term: string) {
  const query = term.trim()

  if (query.length < 3) {
    return {
      products: [],
      categories: [],
    }
  }

  const [products, categories] = await Promise.all([
    searchProductRows(query, 5),
    searchCategoryRows(query, 4),
  ])

  return {
    products: products.map(mapProductRow).map((product) => ({
      ...product,
      href: `/product/${product.slug}`,
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      href: `/shop?category=${category.slug}`,
      image: category.imageKey ? getS3ObjectPreviewUrl(category.imageKey) : '',
    })),
  }
}

function uniqueOptions(values: (string | null | undefined)[]) {
  const map = new Map<string, string>()

  for (const v of values) {
    if (!v || !v.trim()) continue
    const val = v.trim()
    const lower = val.toLowerCase()
    
    if (!map.has(lower)) {
      // Create a nice label by capitalizing the first letter
      const label = lower.charAt(0).toUpperCase() + lower.slice(1)
      map.set(lower, label)
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([lower, label]) => ({ label, value: lower }))
}

function getFilterParamKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function getCatalogFilterOptions() {
  const [categories, variants, customFilters, priceRange] = await Promise.all([
    isProductionBuild ? [] : getCachedCategoryRows(100),
    listVariantFilterOptionRows(),
    listCatalogProductFilterOptionRows(),
    getCatalogProductPriceRange(),
  ])
  const customGroups = customFilters.reduce<
    Record<string, { title: string; paramKey: string; values: string[] }>
  >((groups, filter) => {
    const title = filter.name.trim()
    const paramKey = getFilterParamKey(title)

    if (!title || !paramKey) return groups

    groups[paramKey] ??= {
      title,
      paramKey,
      values: [],
    }

    groups[paramKey].values.push(filter.value)
    return groups
  }, {})

  return {
    categories: categories.map((category) => ({
      label: category.name,
      value: category.slug,
    })),
    colors: uniqueOptions(variants.map((variant) => variant.color)),
    fabrics: uniqueOptions(variants.map((variant) => variant.fabric)),
    sizes: uniqueOptions(variants.map((variant) => variant.size)),
    availability: [
      { label: 'In Stock', value: 'in-stock' },
      { label: 'Out of Stock', value: 'out-of-stock' },
    ],
    customGroups: Object.values(customGroups).map((group) => ({
      title: group.title,
      paramKey: group.paramKey,
      items: uniqueOptions(group.values),
    })),
    priceRange: {
      min: Math.floor((priceRange.minPrice ?? 0) / 100),
      max: Math.ceil((priceRange.maxPrice ?? 0) / 100),
    },
  }
}

export async function getProductDetailsBySlug(slug: string) {
  const product = await findProductDetailBySlug(slug)

  if (!product) {
    return null
  }

  const [variants, media, attributes, reviews] = await Promise.all([
    listProductDetailVariants(product.id),
    listProductDetailMedia(product.id),
    listProductDetailAttributes(product.id),
    listProductReviews(product.id),
  ])

  const reviewIds = reviews.map((r) => r.id)
  const reviewMediaRows = await listReviewMediaRows(reviewIds)

  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0]
  const price = (defaultVariant?.price ?? product.basePrice) / 100
  const strikeThroughPrice =
    (defaultVariant?.strikeThroughPrice ?? product.strikeThroughPrice ?? 0) / 100
  const reviewCount = reviews.length
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0
  const ratingRows = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((review) => review.rating === rating).length

    return {
      rating,
      percent: reviews.length ? Math.round((count / reviews.length) * 100) : 0,
    }
  })

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    sku: defaultVariant?.sku ?? product.sku,
    description: product.description ?? product.shortDescription ?? '',
    short_description: product.shortDescription ?? '',
    price,
    strikeThroughPrice: strikeThroughPrice || null,
    variants: variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      instagramLink: variant.instagramLink,
      price: variant.price / 100,
      strikeThroughPrice: variant.strikeThroughPrice
        ? variant.strikeThroughPrice / 100
        : null,
      stockQuantity: variant.stockQuantity,
      color: variant.color ?? variant.title,
      fabric: variant.fabric,
      size: variant.size,
      isDefault: variant.isDefault,
      rating: averageRating,
      reviewCount,
      image: (() => {
        const imageKey =
          variant.bannerImage ??
          media.find((item) => item.variantId === variant.id)?.key ??
          media.find((item) => item.variantId === defaultVariant?.id && item.isPrimary)?.key ??
          media[0]?.key

        return imageKey ? getS3ObjectPreviewUrl(imageKey) : ''
      })(),
    })),
    media: media.map((item) => ({
      id: item.id,
      src: getS3ObjectPreviewUrl(item.key),
      alt: item.altText ?? product.name,
      variantId: item.variantId,
      isPrimary: item.isPrimary,
    })),
    attributes: attributes.map((attribute) => ({
      id: attribute.id,
      name: attribute.name,
      value: attribute.value,
    })),
    reviews: reviews.map((review) => {
      const reviewMedia = reviewMediaRows
        .filter((m) => m.reviewId === review.id)
        .map((m) => ({
          key: m.key,
          url: getS3ObjectPreviewUrl(m.key),
          contentType: m.contentType,
        }))

      return {
        id: review.id,
        rating: review.rating,
        title: review.title ?? 'Customer review',
        message: review.message,
        reviewerName: review.reviewerName ?? 'Customer',
        createdAt: review.createdAt.toISOString(),
        media: reviewMedia,
      }
    }),
    reviewSummary: {
      averageRating,
      reviewCount,
      ratingRows,
    },
  }
}
