"use client"

import { CartItemRow } from "@/components/cart/CartItemRow"
import { IncompletePaymentBanner } from "@/components/cart/IncompletePaymentBanner"
import { OrderSummary } from "@/components/cart/OrderSummary"
import { ProductRecommendations } from "@/components/cart/ProductRecommendations"
import { getCartSummary, type Product } from "@/components/global/const"
import { useCartStore } from "@/store/cartStore"
import type { CartItem } from "@/store/cartTypes"

const cartBackgroundImage = "/404.png"

export function CartPage({
  recommendedProducts,
}: {
  recommendedProducts?: Product[]
}) {
  const cartItems = useCartStore((state) => state.items)
  const productItems = recommendedProducts ?? []

  const summary = getCartSummary(cartItems)

  return (
    <main className="min-h-screen bg-white pt-16">
      <section
        className="relative overflow-hidden bg-white bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: `url(${cartBackgroundImage})` }}
      >
        <div className="mx-auto max-w-[1130px] px-5 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-16 lg:pt-11">
          <IncompletePaymentBanner />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_310px]">
            {cartItems.length > 0 ? (
              <CartItemsTable items={cartItems} />
            ) : (
              <EmptyCart />
            )}
            <OrderSummary
              subtotal={summary.subtotal}
              shipping={summary.shipping}
              gst={summary.gst}
              total={summary.total}
            />
          </div>

          <ProductRecommendations products={productItems} />
        </div>
      </section>
    </main>
  )
}

function CartItemsTable({ items }: { items: CartItem[] }) {
  return (
    <section className="min-w-0">
      <div className="hidden border-b border-[#3F2617]/55 pb-3 text-[11px] font-medium text-[#3F2617] md:grid md:grid-cols-[minmax(0,1fr)_110px_110px_110px_56px] md:items-center">
        <span>Product</span>
        <span className="text-center">Quantity</span>
        <span className="text-center">Price</span>
        <span className="text-center">Total</span>
        <span />
      </div>

      <div>
        {items.map((item) => (
          <CartItemRow key={`${item.productId}-${item.addedAt}`} item={item} />
        ))}
      </div>
    </section>
  )
}

function EmptyCart() {
  return (
    <section className="border-y border-[#3F2617]/55 py-10 text-center text-[#3F2617]">
      <h1 className="font-heading text-2xl font-semibold">Your cart is empty</h1>
      <p className="mt-2 text-sm text-[#3F2617]/70">
        Add a product from the shop and it will appear here.
      </p>
    </section>
  )
}
