/* eslint-disable @typescript-eslint/no-explicit-any */

export type AdminProductStatus = 'draft' | 'active' | 'archived'

export type AdminProductQuery = {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  status?: AdminProductStatus | string
}

export type AdminProductPayload = Record<string, any>

export type ParsedAdminProductInput = {
  payload: AdminProductPayload
  categoryIds: string[]
  id?: string
}

export function parseAdminProductInput(
  input: AdminProductPayload | FormData,
): ParsedAdminProductInput {
  if (!(input instanceof FormData)) {
    return {
      payload: input,
      categoryIds: input.categoryIds ?? [],
      id: input.id as string | undefined,
    }
  }

  const rawPayload = input.get('variants')
  const payload =
    typeof rawPayload === 'string'
      ? (JSON.parse(rawPayload) as AdminProductPayload)
      : {}

  return {
    payload,
    categoryIds: input.getAll('category[]').map(String),
    id: String(input.get('id') ?? payload.id ?? ''),
  }
}

export function getPrimaryAdminProductVariant(payload: AdminProductPayload) {
  if (Array.isArray(payload.variants)) {
    return (
      payload.variants.find((variant) => Boolean(variant?.isDefault)) ??
      payload.variants[0] ??
      payload
    )
  }

  return payload.variants ?? payload.variant ?? payload
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function validateStrikeThroughPrice({
  price,
  strikeThroughPrice,
  label,
}: {
  price: unknown
  strikeThroughPrice: unknown
  label: string
}) {
  if (!hasValue(strikeThroughPrice)) return

  const priceValue = Number(price)
  const strikeValue = Number(strikeThroughPrice)

  if (!Number.isFinite(priceValue) || !Number.isFinite(strikeValue)) {
    throw new Error(`${label} price must be a valid number`)
  }

  if (strikeValue <= priceValue) {
    throw new Error(`${label} strike-through price must be greater than price`)
  }
}

function validateAdminProductPrices(payload: AdminProductPayload) {
  validateStrikeThroughPrice({
    price: payload.price,
    strikeThroughPrice: payload.strikeThroughPrice ?? payload.strikethroughPrice,
    label: 'Product',
  })

  if (!Array.isArray(payload.variants)) return

  payload.variants.forEach((variant: AdminProductPayload, index: number) => {
    validateStrikeThroughPrice({
      price: variant.price,
      strikeThroughPrice:
        variant.strikeThroughPrice ?? variant.strikethroughPrice,
      label: `Variant ${index + 1}`,
    })
  })
}

export function validateAdminProductCreateInput(
  input: AdminProductPayload | FormData,
) {
  const parsed = parseAdminProductInput(input)
  const variant = getPrimaryAdminProductVariant(parsed.payload)
  const name = String(variant.name ?? parsed.payload.name ?? '').trim()

  if (!name) {
    throw new Error('Product name is required')
  }

  validateAdminProductPrices(parsed.payload)

  return parsed
}

export function validateAdminProductUpdateInput(
  idOrInput: string | FormData,
  payloadInput?: AdminProductPayload,
) {
  const parsed =
    typeof idOrInput === 'string'
      ? {
          payload: payloadInput ?? {},
          categoryIds: payloadInput?.categoryIds ?? [],
          id: idOrInput,
        }
      : parseAdminProductInput(idOrInput)

  if (!parsed.id) {
    throw new Error('Product id is required')
  }

  const variant = getPrimaryAdminProductVariant(parsed.payload)
  const name = String(variant.name ?? parsed.payload.name ?? '').trim()

  if (!name) {
    throw new Error('Product name is required')
  }

  validateAdminProductPrices(parsed.payload)

  return {
    ...parsed,
    id: parsed.id,
  }
}

export function validateAdminProductQuery(query: unknown): AdminProductQuery {
  const data = query as Partial<AdminProductQuery>

  return {
    page: Number(data.page ?? 1),
    pageSize: Number(data.pageSize ?? 10),
    search: data.search,
    category: data.category,
    status: data.status,
  }
}
