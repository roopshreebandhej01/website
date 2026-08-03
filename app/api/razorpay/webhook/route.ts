import {
  isCapturedRazorpayPayment,
  type RazorpayWebhookPaymentEvent,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay"
import {
  saveRazorpayPaymentStatus,
  sendPurchaseNotifications,
} from "@/lib/payment-flow"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("x-razorpay-signature")

  try {
    if (!verifyRazorpayWebhookSignature({ body, signature })) {
      return Response.json({ error: "Invalid webhook signature" }, { status: 401 })
    }

    const event = JSON.parse(body) as RazorpayWebhookPaymentEvent
    const payment = event.payload?.payment?.entity
    const providerOrderId = payment?.order_id

    if (!payment || !providerOrderId) {
      return Response.json({ error: "Invalid payment event" }, { status: 400 })
    }

    if (event.event === "payment.captured") {
      if (!isCapturedRazorpayPayment(payment)) {
        return Response.json({ error: "Payment is not captured" }, { status: 400 })
      }

      const result = await saveRazorpayPaymentStatus({
        providerOrderId,
        providerPaymentId: payment.id,
        amountInPaise: payment.amount,
        method: payment.method,
        razorpayStatus: payment.status,
        metadata: {
          webhookEvent: event.event,
          razorpayPayment: payment,
        },
      })

      if (result.shouldNotifyPurchase) {
        await sendPurchaseNotifications(result.orderId)
      }

      return Response.json({ received: true })
    }

    if (event.event === "payment.failed") {
      await saveRazorpayPaymentStatus({
        providerOrderId,
        providerPaymentId: payment.id,
        amountInPaise: payment.amount,
        method: payment.method,
        razorpayStatus: payment.status,
        metadata: {
          webhookEvent: event.event,
          razorpayPayment: payment,
        },
      })

      return Response.json({ received: true })
    }

    return Response.json({ received: true, ignored: true })
  } catch (error) {
    console.error("Razorpay webhook failed:", error)
    return Response.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
