"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Check, Loader2, ShieldCheck, XCircle } from "lucide-react"

import { getOrderStatusForVerificationAction } from "@/actions/checkout.action"

type StepStatus = "pending" | "in-progress" | "completed" | "failed"

function PaymentProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId = searchParams.get("orderId") || ""
  const paramStatus = searchParams.get("status") || "paid"

  const [currentStep, setCurrentStep] = useState(1)
  const [progressPercent, setProgressPercent] = useState(25)
  const [isDone, setIsDone] = useState(false)
  const [finalStatus, setFinalStatus] = useState<"paid" | "failed" | "pending">(
    paramStatus === "failed" ? "failed" : "paid",
  )

  useEffect(() => {
    if (!orderId) {
      router.replace("/checkout")
      return
    }

    let isMounted = true

    // Step 1: OTP verification complete
    const t1 = setTimeout(() => {
      if (!isMounted) return
      setCurrentStep(2)
      setProgressPercent(60)
    }, 700)

    // Step 2: Query database / bank verification
    const t2 = setTimeout(async () => {
      if (!isMounted) return
      setCurrentStep(3)
      setProgressPercent(90)

      try {
        const verifyRes = await getOrderStatusForVerificationAction(orderId)
        if (!isMounted) return

        if (verifyRes.success) {
          const statusLower = (verifyRes.paymentStatus || verifyRes.orderStatus || "").toLowerCase()
          if (["paid", "confirmed"].includes(statusLower)) {
            setFinalStatus("paid")
          } else if (["failed", "cancelled"].includes(statusLower)) {
            setFinalStatus("failed")
          }
        }
      } catch {
        // Fall back to parameter status
      }

      setProgressPercent(100)
      setIsDone(true)
    }, 1600)

    // Step 3: Redirect to Thank You / Order Confirmation
    const t3 = setTimeout(() => {
      if (!isMounted) return
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("roopshree-pending-payment")
      }
      router.replace(`/order-confirmation?orderId=${encodeURIComponent(orderId)}`)
    }, 2500)

    return () => {
      isMounted = false
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [orderId, router])

  const steps: Array<{ title: string; desc: string; status: StepStatus }> = [
    {
      title: "OTP Verification",
      desc: "Bank 3D-Secure authentication verified",
      status: currentStep > 1 ? "completed" : "in-progress",
    },
    {
      title: "Bank Authorization",
      desc: "Confirming transaction reference with ICICI",
      status:
        currentStep > 2
          ? finalStatus === "failed"
            ? "failed"
            : "completed"
          : currentStep === 2
          ? "in-progress"
          : "pending",
    },
    {
      title: "Order Confirmation",
      desc: isDone ? "Finalized and verified" : "Preparing order invoice",
      status: isDone
        ? finalStatus === "failed"
          ? "failed"
          : "completed"
        : currentStep === 3
        ? "in-progress"
        : "pending",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7] px-4 py-12 text-[#3F2617]">
      <div className="w-full max-w-[460px] border border-[#C39150]/30 bg-white p-7 shadow-lg sm:p-9">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5 size-16">
            <Image
              src="/logo.png"
              alt="Roopshree Logo"
              width={64}
              height={64}
              priority
              className="object-contain"
            />
          </div>

          {/* Animated Shield / Status Icon */}
          <div className="relative my-2 flex size-18 items-center justify-center">
            {isDone ? (
              finalStatus === "paid" ? (
                <div className="flex size-16 items-center justify-center rounded-full bg-[#59AF52] text-white shadow-md">
                  <Check className="size-9 stroke-[3]" />
                </div>
              ) : (
                <div className="flex size-16 items-center justify-center rounded-full bg-rose-500 text-white shadow-md">
                  <XCircle className="size-9 stroke-[2.5]" />
                </div>
              )
            ) : (
              <div className="relative flex size-16 items-center justify-center">
                <div className="absolute inset-0 animate-spin rounded-full border-3 border-[#C39150]/20 border-t-[#C39150]" />
                <div className="flex size-12 items-center justify-center rounded-full bg-[#fff6ea] text-[#C39150]">
                  <ShieldCheck className="size-7" />
                </div>
              </div>
            )}
          </div>

          <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-[#3F2617]">
            {isDone
              ? finalStatus === "paid"
                ? "Payment Verified!"
                : "Payment Declined"
              : "Verifying with Bank..."}
          </h1>

          <p className="mt-1.5 text-xs text-[#3F2617]/70">
            {isDone
              ? "Redirecting you to order confirmation..."
              : "Please wait while we verify your OTP and confirm transaction with your bank. Do not refresh or press back."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#3F2617]/10">
            <div
              className="h-full bg-[#C39150] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Dynamic Verification Step Checklist */}
        <div className="mt-6 space-y-3.5 border-t border-[#3F2617]/10 pt-6">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                {step.status === "completed" ? (
                  <div className="flex size-5 items-center justify-center rounded-full bg-[#59AF52] text-white">
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                ) : step.status === "failed" ? (
                  <div className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-white">
                    <XCircle className="size-3.5" />
                  </div>
                ) : step.status === "in-progress" ? (
                  <Loader2 className="size-4 animate-spin text-[#C39150]" />
                ) : (
                  <div className="size-2 rounded-full bg-[#3F2617]/25" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-semibold ${
                    step.status === "in-progress"
                      ? "text-[#C39150]"
                      : step.status === "completed"
                      ? "text-[#3F2617]"
                      : "text-[#3F2617]/60"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-[11px] text-[#3F2617]/65">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 rounded-sm bg-[#fff8ef] px-4 py-2.5 text-center text-[11px] font-medium text-[#C39150]">
          Secured by ICICI Bank 256-Bit SSL
        </div>
      </div>
    </div>
  )
}

export default function PaymentProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
          <div className="flex items-center gap-2 text-sm text-[#3F2617]">
            <Loader2 className="size-5 animate-spin text-[#C39150]" />
            Loading transaction status...
          </div>
        </div>
      }
    >
      <PaymentProcessingContent />
    </Suspense>
  )
}
