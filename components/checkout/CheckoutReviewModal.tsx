import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Clock, X } from "lucide-react"

import {
  completeRazorpayPayment,
  createBuyNowPaymentOrder,
  createCartPaymentOrder,
  createBuyNowPaymentOrderIcici,
  createCartPaymentOrderIcici,
  getPendingOrderSummaryAction,
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
  onClose,
}: {
  items: CartItem[]
  summary: CartSummary
  source: "cart" | "buy-now"
  shipping: CheckoutShippingDetails
  onClose: () => void
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const clearCart = useCartStore((state) => state.clearCart)
  const [paymentGateway, setPaymentGateway] = useState<"razorpay" | "icici">("icici")
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [hasIncompletePayment, setHasIncompletePayment] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isPaymentMethodModalOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isPaymentMethodModalOpen])

  useEffect(() => {
    const handlePageShow = () => {
      setIsPaying(false)
      setIsPaymentMethodModalOpen(false)
    }

    window.addEventListener("pageshow", handlePageShow)
    return () => window.removeEventListener("pageshow", handlePageShow)
  }, [])

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
      const buyNowItem = source === "buy-now" ? items[0] : null

      // --- ICICI Bank Hosted Gateway Flow ---
      if (paymentGateway === "icici") {
        const orderResult =
          source === "buy-now"
            ? await createBuyNowPaymentOrderIcici({
                shipping,
                productId: buyNowItem?.dbProductId,
                variantId: buyNowItem?.variantId,
                quantity: buyNowItem?.quantity ?? 1,
                totalAmount: summary.total,
              })
            : await createCartPaymentOrderIcici({
                shipping,
                totalAmount: summary.total,
              })

        if (orderResult.userIsNotLoggedIn) {
          router.push("/auth?callbackUrl=/checkout")
          return
        }

        if (!orderResult.success || !orderResult.redirectUrl) {
          showToast({
            title: orderResult.message ?? "Unable to initialize ICICI payment",
            tone: "error",
          })
          setIsPaying(false)
          return
        }

        if (source === "buy-now") {
          window.sessionStorage.removeItem("roopshree-buy-now")
        }

        window.sessionStorage.setItem(
          "roopshree-pending-payment",
          JSON.stringify({
            merchantTxnNo: orderResult.merchantTxnNo,
            orderId: orderResult.orderId,
            source,
            timestamp: Date.now(),
          }),
        )

        showToast({ title: "Redirecting to ICICI Bank...", tone: "info" })
        window.location.assign(orderResult.redirectUrl)
        return
      }

      // --- Razorpay Flow ---
      const scriptLoaded = await loadRazorpayScript()

      if (!scriptLoaded || !window.Razorpay) {
        showToast({ title: "Unable to load payment gateway", tone: "error" })
        setIsPaying(false)
        return
      }

      const orderResult =
        source === "buy-now"
          ? await createBuyNowPaymentOrder({
              shipping,
              productId: buyNowItem?.dbProductId,
              variantId: buyNowItem?.variantId,
              quantity: buyNowItem?.quantity ?? 1,
              totalAmount: summary.total,
            })
          : await createCartPaymentOrder({
              shipping,
              totalAmount: summary.total,
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
        setIsPaying(false)
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
          const completeResult = await completeRazorpayPayment({
            checkoutToken: orderResult.checkoutToken,
            razorpay: response,
          })

          if (!completeResult.success) {
            showToast({
              title: completeResult.message ?? "Payment verification failed",
              tone: "error",
            })
            setIsPaying(false)
            return
          }

          if (!completeResult.orderId) {
            showToast({
              title: "Order confirmation is unavailable",
              tone: "error",
            })
            setIsPaying(false)
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
        },
      })

      razorpay.on("payment.failed", () => {
        showToast({ title: "Payment failed", tone: "error" })
        setIsPaying(false)
      })

      razorpay.open()
    } catch (error) {
      console.error(error)
      showToast({ title: "Unable to complete payment", tone: "error" })
      setIsPaying(false)
    }
  }

  return (
    <>
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
              {shipping.fullName || "-"} · {shipping.phone || "-"}
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
              onClick={() => setIsPaymentMethodModalOpen(true)}
              className="mt-4 h-11 w-full bg-[#C39150] px-6 text-sm font-semibold tracking-[0.05em] text-white transition hover:bg-[#3F2617]"
            >
              Place Order
            </button>
          </div>
        </section>

        <CheckoutSummary items={items} summary={summary} />
      </div>

      {/* Payment Method Selection Modal */}
      {isPaymentMethodModalOpen &&
        isMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md border border-[#C39150]/60 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-heading text-base font-semibold text-[#3F2617]">
                    Select Payment Method
                  </h3>
                  <p className="text-[11px] text-[#3F2617]/70">
                    Total Payable:{" "}
                    <span className="font-semibold text-[#C39150]">
                      {formatPrice(summary.total)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentMethodModalOpen(false)}
                  className="rounded-full p-1 text-[#3F2617]/70 hover:bg-gray-100 hover:text-[#3F2617]"
                >
                  <X className="size-5" />
                </button>
              </div>

              {hasIncompletePayment && (
                <div className="mt-3 flex items-start gap-2 border border-amber-300 bg-amber-50/90 p-2.5 text-[11px] text-amber-900">
                  <Clock className="size-4 shrink-0 text-amber-600 mt-0.5" />
                  <p>
                    An incomplete payment attempt was detected. You can re-attempt below or select another payment method.
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="mt-4 space-y-3">
                <label
                  className={`flex cursor-pointer items-start justify-between border p-3.5 transition ${
                    paymentGateway === "icici"
                      ? "border-[#C39150] bg-[#FAF6F0]"
                      : "border-gray-200 bg-white hover:border-[#C39150]/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentGateway"
                      value="icici"
                      checked={paymentGateway === "icici"}
                      onChange={() => setPaymentGateway("icici")}
                      className="mt-0.5 h-4 w-4 accent-[#C39150]"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-[#3F2617]">
                        ICICI Bank Gateway
                      </span>
                      <span className="block text-[11px] text-[#3F2617]/75">
                        Credit/Debit Cards, UPI (GPay/PhonePe), Net Banking
                      </span>
                      <span className="mt-1 inline-block rounded bg-[#C39150]/15 px-1.5 py-0.5 text-[9px] font-medium text-[#C39150]">
                        Direct Bank &bull; Recommended
                      </span>
                    </div>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start justify-between border p-3.5 transition ${
                    paymentGateway === "razorpay"
                      ? "border-[#C39150] bg-[#FAF6F0]"
                      : "border-gray-200 bg-white hover:border-[#C39150]/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentGateway"
                      value="razorpay"
                      checked={paymentGateway === "razorpay"}
                      onChange={() => setPaymentGateway("razorpay")}
                      className="mt-0.5 h-4 w-4 accent-[#C39150]"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-[#3F2617]">
                        Razorpay
                      </span>
                      <span className="block text-[11px] text-[#3F2617]/75">
                        UPI, Cards, Net Banking, Wallets
                      </span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentMethodModalOpen(false)}
                  disabled={isPaying}
                  className="h-11 flex-1 border border-gray-300 text-xs font-semibold uppercase tracking-wider text-[#3F2617] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="h-11 flex-1 bg-[#C39150] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#3F2617] disabled:opacity-60"
                >
                  {isPaying ? "Processing..." : "Proceed to Pay"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
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
