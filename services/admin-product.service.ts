import {
  countAdminProducts,
  deleteAdminProduct,
  findFullProduct,
  findProductFilterOptionRows,
  findProductsPage,
  insertAdminProduct,
  updateAdminProduct,
} from '@/repositories/admin-product.repository'
import { getS3ObjectPreviewUrl } from '@/lib/s3'
import {
  getPrimaryAdminProductVariant,
  type AdminProductPayload,
  type AdminProductQuery,
  type ParsedAdminProductInput,
} from '@/validators/admin-product.validator'

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toPaise(value: unknown) {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? Math.round(numberValue * 100) : 0
}

function buildProductBaseValues(payload: AdminProductPayload) {
  const variant = getPrimaryAdminProductVariant(payload)
  const name = String(variant.name ?? payload.name ?? '').trim()
  const requestedSlug = String(payload.slug ?? '').trim()

  return {
    name,
    sku: (String(variant.sku || payload.sku || slugify(name)).trim()) || slugify(name),
    slug: slugify(requestedSlug || name),
    shortDescription: payload.shortDescription || null,
    description: variant.description ?? payload.description ?? null,
    basePrice: toPaise(variant.price ?? payload.price),
    strikeThroughPrice: toPaise(
      variant.strikeThroughPrice ??
        variant.strikethroughPrice ??
        payload.strikeThroughPrice ??
        payload.strikethroughPrice,
    ),
    status: payload.status ?? 'active',
    isFeatured: Boolean(payload.isFeatured),
    isNewArrival: Boolean(payload.isNewArrival),
    isTrending: Boolean(payload.isTrending),
  }
}

export async function getProductsService(query: AdminProductQuery = {}) {
  const { rows, page, pageSize, totalItems } = await findProductsPage(query)
  const items = rows.map((item) => ({
    ...item,
    image: item.imageKey
      ? getS3ObjectPreviewUrl(item.imageKey)
      : item.variantBannerImage
        ? getS3ObjectPreviewUrl(item.variantBannerImage)
        : '',
    strikethroughPrice: item.strikeThroughPrice,
    isCancelable: true,
    isReturnable: true,
    isDeleted: item.status === 'archived',
  }))

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  }
}

export async function getFullProductService(id: string) {
  const result = await findFullProduct(id)

  if (!result) return null

  return {
    ...result.product,
    strikethroughPrice: result.product.strikeThroughPrice,
    categoryRes: result.categoryRes,
    productAttributeRes: result.productAttributeRes.map((item) => ({
      ...item,
      attribute: item.name,
    })),
    productMediaRes: result.productMediaRes.map((item) => ({
      ...item,
      mediaURL: item.key,
      previewUrl: getS3ObjectPreviewUrl(item.key),
    })),
    productVariantRes: result.productVariantRes,
    variants: result.productVariantRes,
    filters: result.filters.map((item) => ({
      ...item,
      type: item.name,
      filter: item.value,
    })),
    productFaqRes: [],
    prodcutVarientBoxRes: [],
  }
}

export async function createAdminProductService(input: ParsedAdminProductInput) {
  return insertAdminProduct(
    input.payload,
    input.categoryIds,
    buildProductBaseValues(input.payload),
  )
}

export async function updateAdminProductService(
  input: ParsedAdminProductInput & { id: string },
) {
  return updateAdminProduct(input.id, input.payload, input.categoryIds, {
    ...buildProductBaseValues(input.payload),
    updatedAt: new Date(),
  })
}

export async function deleteAdminProductService(id: string) {
  await deleteAdminProduct(id)
}

export async function getProductsCountService() {
  return countAdminProducts()
}

export async function getProductFilterOptionsService() {
  const rows = await findProductFilterOptionRows()
  const byName = (name: string) =>
    rows
      .filter((row) => row.name === name)
      .map((row) => ({ label: row.value, value: row.value }))

  return {
    finishOptions: byName('finish'),
    sizeOptions: byName('size'),
    materialOptions: byName('material'),
  }
}
