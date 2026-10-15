"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, Loader2, X } from "lucide-react"

import {
  cancelPendingOrderAction,
  getPendingOrderSummaryAction,
} from "@/actions/checkout.action"
import { useToast } from "@/components/common/ToastProvider"

export function IncompletePaymentBanner() {
  const { showToast } = useToast()
  const [pendingPayment, setPendingPayment] = useState<{
    merchantTxnNo?: string
    orderId?: string
    source?: string
    timestamp?: number
  } | null>(null)
  const [isDiscarding, setIsDiscarding] = useState(false)

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem("roopshree-pending-payment")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Date.now() - (parsed.timestamp || 0) < 2 * 60 * 60 * 1000) {
          setPendingPayment(parsed)
          return
        }
        window.sessionStorage.removeItem("roopshree-pending-payment")
      }
    } catch {}

    void getPendingOrderSummaryAction().then((res) => {
      if (res?.hasPending && res.order) {
        setPendingPayment({
          orderId: res.order.id,
          timestamp: Date.now(),
        })
      }
    })
  }, [])

  const handleDiscard = async () => {
    setIsDiscarding(true)
    try {
      if (pendingPayment?.merchantTxnNo || pendingPayment?.orderId) {
        await cancelPendingOrderAction({
          merchantTxnNo: pendingPayment.merchantTxnNo,
          orderId: pendingPayment.orderId,
        })
      }
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("roopshree-pending-payment")
      }
      setPendingPayment(null)
      showToast({ title: "Incomplete payment cancelled", tone: "info" })
    } catch {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("roopshree-pending-payment")
      }
      setPendingPayment(null)
    } finally {
      setIsDiscarding(false)
    }
  }

  if (!pendingPayment) return null

  return (
    <div className="mb-6 border border-amber-300 bg-[#fff9ed] p-4 text-[#3F2617] shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Clock className="size-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-[#3F2617]">
              Incomplete Payment
            </h3>
            <p className="mt-1 text-xs text-[#3F2617]/80">
              Your previous payment session was incomplete. You can complete the payment again or cancel it.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.sessionStorage.removeItem("roopshree-pending-payment")
                  }
                  window.location.href = "/checkout"
                }}
                className="bg-[#C39150] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#3F2617]"
              >
                Complete Payment Now
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={isDiscarding}
                className="inline-flex items-center gap-1.5 border border-[#C39150]/60 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#3F2617] transition hover:bg-[#fff0db] disabled:opacity-50"
              >
                {isDiscarding ? (
                  <>
                    <Loader2 className="size-3 animate-spin text-[#C39150]" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Payment"
                )}
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDiscard}
          className="text-stone-400 transition hover:text-stone-600"
          title="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
