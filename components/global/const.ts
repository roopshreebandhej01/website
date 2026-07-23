import { getRupeeOrderSummary, type SummaryItem } from "@/lib/checkout-pricing"

export type Product = {
  id: number | string
  variantId?: string | null
  slug: string
  name: string
  colour: string
  price: number
  stockQuantity?: number
  rating?: number
  reviewCount?: number
  image: string
  imageClass?: string
  isFeatured?: boolean
  isNewArrival?: boolean
  isTrending?: boolean
}

export function productToCartItem(product: Product) {
  const productId = product.variantId
    ? `${product.slug}:${product.variantId}`
    : product.slug

  return {
    productId,
    dbProductId: typeof product.id === "string" ? product.id : undefined,
    variantId: product.variantId ?? undefined,
    title: product.name,
    price: product.price,
    stockQuantity: product.stockQuantity,
    image: product.image,
    colour: product.colour,
    imageClass: product.imageClass,
    attributes: product.colour
      ? [{ name: "Colour", value: product.colour }]
      : undefined,
  }
}
export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price)
}

export type CartSummaryItem = SummaryItem

export function getCartSummary(items: CartSummaryItem[]) {
  return getRupeeOrderSummary(items)
}
