import crypto from "node:crypto"

export type RazorpayPayment = {
  id: string
  order_id?: string | null
  amount: number
  currency: string
  status: string
  method?: string | null
  captured?: boolean
}

export type RazorpayWebhookPaymentEvent = {
  event?: string
  payload?: {
    payment?: {
      entity?: RazorpayPayment & Record<string, unknown>
    }
  }
}

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
}

export function getRazorpaySecret() {
  return process.env.RAZORPAY_KEY_SECRET
}

function getRazorpayAuthHeader() {
  const keyId = getRazorpayKeyId()
  const keySecret = getRazorpaySecret()

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured")
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`
}

export async function fetchRazorpayPayment(paymentId: string) {
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: getRazorpayAuthHeader(),
      },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error("Unable to verify Razorpay payment")
  }

  return (await response.json()) as RazorpayPayment
}

export function isCapturedRazorpayPayment(payment: RazorpayPayment) {
  return payment.status === "captured" && payment.captured !== false
}

export function verifyRazorpayWebhookSignature({
  body,
  signature,
}: {
  body: string
  signature: string | null
}) {
  const secret = process.env.RZ_WEBHOOK_SECRET

  if (!secret) {
    throw new Error("Razorpay webhook secret is not configured")
  }

  if (!signature) {
    return false
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")

  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  return (
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  )
}
