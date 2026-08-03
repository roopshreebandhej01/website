import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LoaderCircle } from "lucide-react"

import {
  completeRazorpayPayment,
  createBuyNowPaymentOrder,
  createCartPaymentOrder,
} from "@/actions/checkout.action"
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary"
import { BackButton, CheckoutSteps } from "@/components/checkout/CheckoutSteps"
import type { CheckoutShippingDetails } from "@/components/checkout/CheckoutFlow"
import { formatPrice } from "@/components/global/const"
import { useToast } from "@/components/common/ToastProvider"
import { useCartStore } from "@/store/cartStore"
import type { CartItem } from "@/store/cartTypes"

type CartSummary = {
  subtotal: number
  shipping: number
  gst: number
  total: number
}

type RazorpayCheckoutSuccess = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayCheckoutSuccess) => void
  prefill?: {
    name?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void
      on: (event: string, callback: () => void) => void
    }
  }
}

export function CheckoutReviewModal({
  items,
  summary,
  source,
  shipping,
  isGuest,
  onClose,
}: {
  items: CartItem[]
  summary: CartSummary
  source: "cart" | "buy-now"
  shipping: CheckoutShippingDetails
  isGuest: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const clearCart = useCartStore((state) => state.clearCart)
  const [isPaying, setIsPaying] = useState(false)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)

  async function loadRazorpayScript() {
    if (window.Razorpay) return true

    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function handlePayment() {
    setIsPaying(true)

    try {
      const scriptLoaded = await loadRazorpayScript()

      if (!scriptLoaded || !window.Razorpay) {
        showToast({ title: "Unable to load payment gateway", tone: "error" })
        return
      }

      const buyNowItem = source === "buy-now" ? items[0] : null
      const orderResult =
        source === "buy-now"
          ? await createBuyNowPaymentOrder({
              shipping,
              productId: buyNowItem?.dbProductId,
              variantId: buyNowItem?.variantId,
              quantity: buyNowItem?.quantity ?? 1,
            })
          : await createCartPaymentOrder({
              shipping,
              guestItems: isGuest
                ? items.map((item) => ({
                    productId: item.dbProductId ?? item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                  }))
                : undefined,
            })

      if (orderResult.userIsNotLoggedIn) {
        router.push("/auth?callbackUrl=/checkout")
        return
      }

      if (!orderResult.success || !orderResult.keyId) {
        showToast({
          title: orderResult.message ?? "Unable to start payment",
          tone: "error",
        })
        return
      }

      const razorpay = new window.Razorpay({
        key: orderResult.keyId,
        amount: orderResult.amountInPaise,
        currency: orderResult.currency,
        name: "Roop Shree",
        description: "Order payment",
        order_id: orderResult.providerOrderId,
        prefill: {
          name: shipping.fullName,
          contact: shipping.phone,
        },
        theme: {
          color: "#C39150",
        },
        handler: async (response) => {
          setIsVerifyingPayment(true)
          try {
            const completeResult = await completeRazorpayPayment({
              checkoutToken: orderResult.checkoutToken,
              razorpay: response,
            })

            if (!completeResult.success) {
              setIsVerifyingPayment(false)
              showToast({
                title: completeResult.message ?? "Payment verification failed",
                tone: "error",
              })
              return
            }

            if (!completeResult.orderId) {
              setIsVerifyingPayment(false)
              showToast({
                title: "Order confirmation is unavailable",
                tone: "error",
              })
              return
            }

            if (completeResult.source === "cart") {
              clearCart()
            } else {
              window.sessionStorage.removeItem("roopshree-buy-now")
            }

            const confirmationUrl = `/order-confirmation?orderId=${encodeURIComponent(
              completeResult.orderId,
            )}`

            showToast({ title: "Payment successful", tone: "success" })
            window.location.assign(confirmationUrl)
          } catch (err) {
            console.error("Payment confirmation error:", err)
            setIsVerifyingPayment(false)
            showToast({ title: "Unable to verify payment", tone: "error" })
          }
        },
      })

      razorpay.on("payment.failed", () => {
        showToast({ title: "Payment failed", tone: "error" })
      })

      razorpay.open()
    } catch (error) {
      console.error(error)
      showToast({ title: "Unable to complete payment", tone: "error" })
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <>
      {isVerifyingPayment && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col items-center justify-center rounded bg-white p-8 text-center text-[#3F2617] shadow-2xl">
            <div className="relative flex size-16 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#C39150]/20 border-t-[#C39150]" />
              <LoaderCircle className="size-6 text-[#C39150]" />
            </div>
            <h3 className="mt-5 font-heading text-xl font-semibold text-[#3F2617]">
              Verifying payment
            </h3>
            <p className="mt-2 text-xs font-medium text-[#3F2617]/75">
              Please wait while Razorpay confirms your payment and we finalize your order...
            </p>
          </div>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)_24px] items-center">
        <BackButton onClick={onClose} />
        <div className="col-start-2">
          <CheckoutSteps activeStep={2} />
        </div>
      </div>

      <div className="mt-8 grid min-w-0 gap-5 md:mt-12 md:grid-cols-[480px_210px] md:items-start md:justify-center">
        <section className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-black">
            Order Review
          </h2>

          <div className="mt-5 space-y-3">
            <ReviewBlock label="Contact">
              {[shipping.fullName || "-", shipping.phone || "-", shipping.secondPhone]
                .filter(Boolean)
                .join(" · ")}
            </ReviewBlock>
            <ReviewBlock label="Ship To">
              {[
                shipping.addressLine1,
                shipping.addressLine2,
                shipping.city,
                shipping.state,
                shipping.postalCode,
              ]
                .filter(Boolean)
                .join(", ") || "-"}
            </ReviewBlock>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.addedAt}`}
                  className="grid min-w-0 gap-3 border-b border-[#C39150]/45 pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="flex min-w-0 gap-4">
                    <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-[#f7eadb]">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="40px"
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading text-xs font-semibold text-[#3F2617]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[10px] text-[#3F2617]/70">
                        {item.colour} Colour · {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="min-w-0 text-xs font-semibold text-[#3F2617] sm:text-right">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={isPaying}
              className="h-11 w-full bg-[#C39150] px-6 text-sm font-semibold tracking-[0.05em] text-white transition hover:bg-[#3F2617] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPaying ? "Starting payment..." : "Continue to Payment"}
            </button>
          </div>
        </section>

        <CheckoutSummary items={items} summary={summary} />
      </div>
    </>
  )
}

function ReviewBlock({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 border border-[#C39150]/60 bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C39150]">
        {label}
      </p>
      <p className="mt-2 break-words text-xs font-medium leading-5 text-[#3F2617]">
        {children}
      </p>
    </div>
  )
}
