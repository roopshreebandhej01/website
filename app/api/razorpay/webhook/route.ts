import { and, eq, sql } from 'drizzle-orm'

import {
  isCapturedRazorpayPayment,
  type RazorpayWebhookPaymentEvent,
  verifyRazorpayWebhookSignature,
} from '@/lib/razorpay'

import {
  saveRazorpayPaymentStatus,
  sendPurchaseNotifications,
} from '@/lib/payment-flow'

import { db } from '@/lib/db'

import { orders, orderItems, payments } from '@/db/schema/orders'

import { users } from '@/db/schema/users'

import {
  buildZohoPayload,
  pushLeadToZohoFlow,
} from '@/lib/zoho-flow'

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

// One initial Zoho attempt plus three retry opportunities.
const ZOHO_MAX_ATTEMPTS = 4
const ZOHO_LOCK_TTL_MS = 9 * 60 * 1000
const ZOHO_RETRY_DELAYS_MS = [
  10 * 60 * 1000,
  30 * 60 * 1000,
  60 * 60 * 1000,
] as const

function asMetaRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function getMetaTime(value: unknown): number | null {
  if (typeof value !== 'string') return null

  const time = Date.parse(value)
  return Number.isNaN(time) ? null : time
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

async function releaseZohoLock({
  razorpayOrderId,
  lockToken,
  metadata,
  error,
}: {
  razorpayOrderId: string
  lockToken: string
  metadata: Record<string, unknown>
  error: string
}) {
  await db
    .update(payments)
    .set({
      metadata: {
        ...metadata,
        zoho_sync_lock_token: null,
        zoho_sync_lock_until: null,
        zoho_last_error: error,
        zoho_last_failed_at: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(payments.providerOrderId, razorpayOrderId),
        sql`${payments.metadata}->>'zoho_sync_lock_token' = ${lockToken}`,
      ),
    )
}

/**
 * Pushes the order lead to Zoho Flow.
 *
 * Tracks attempt state in payments.metadata so:
 *  - A successful push is never duplicated (zoho_synced: true guard)
 *  - Concurrent webhook deliveries cannot push the same lead at the same time
 *  - Failed pushes are retried via Razorpay's webhook retry (503 response)
 *  - Retries stop after one initial attempt plus three retry attempts
 *
 * Returns { shouldRetry: true } when we want Razorpay to retry (503),
 * { shouldRetry: false } when we're done (either succeeded or gave up).
 */
async function syncOrderToZoho(
  razorpayOrderId: string,
): Promise<{ shouldRetry: boolean }> {
  const [payment] = await db
    .select({
      orderId: payments.orderId,
      metadata: payments.metadata,
    })
    .from(payments)
    .where(eq(payments.providerOrderId, razorpayOrderId))
    .limit(1)

  if (!payment) {
    // saveRazorpayPaymentStatus already ran before this call, so the row must exist.
    // If somehow missing, log and bail without retrying.
    console.warn(`[Zoho Sync] Payment row not found: ${razorpayOrderId}`)
    return { shouldRetry: false }
  }

  const meta = asMetaRecord(payment.metadata)

  // Already synced on a previous attempt; nothing to do.
  if (meta.zoho_synced === true) {
    console.log(`[Zoho Sync] Already synced, skipping: ${razorpayOrderId}`)
    return { shouldRetry: false }
  }

  const attemptCount =
    typeof meta.zoho_attempt_count === 'number' ? meta.zoho_attempt_count : 0

  if (attemptCount >= ZOHO_MAX_ATTEMPTS) {
    console.error(
      `[Zoho Sync] Giving up after ${ZOHO_MAX_ATTEMPTS} failed attempts: ${razorpayOrderId}`,
    )
    return { shouldRetry: false }
  }

  const nextRetryAt = getMetaTime(meta.zoho_next_retry_at)
  if (attemptCount > 0 && nextRetryAt && nextRetryAt > Date.now()) {
    console.warn(`[Zoho Sync] Waiting for scheduled retry: ${razorpayOrderId}`)
    return { shouldRetry: true }
  }

  const lockUntilTime = getMetaTime(meta.zoho_sync_lock_until)
  if (lockUntilTime && lockUntilTime > Date.now()) {
    console.warn(`[Zoho Sync] Sync already in progress: ${razorpayOrderId}`)
    return { shouldRetry: true }
  }

  const nextAttemptCount = attemptCount + 1
  const lockToken = `${razorpayOrderId}:${nextAttemptCount}:${Date.now()}`
  const lockMetadata = {
    ...meta,
    zoho_attempt_count: nextAttemptCount,
    zoho_sync_lock_token: lockToken,
    zoho_sync_lock_until: new Date(Date.now() + ZOHO_LOCK_TTL_MS).toISOString(),
  }

  const [lock] = await db
    .update(payments)
    .set({
      metadata: lockMetadata,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(payments.providerOrderId, razorpayOrderId),
        sql`coalesce((${payments.metadata}->>'zoho_synced')::boolean, false) = false`,
        sql`coalesce((${payments.metadata}->>'zoho_attempt_count')::int, 0) = ${attemptCount}`,
        sql`(
          ${payments.metadata}->>'zoho_sync_lock_until' is null
          or (${payments.metadata}->>'zoho_sync_lock_until')::timestamptz <= now()
        )`,
      ),
    )
    .returning({ metadata: payments.metadata })

  if (!lock) {
    const [latestPayment] = await db
      .select({ metadata: payments.metadata })
      .from(payments)
      .where(eq(payments.providerOrderId, razorpayOrderId))
      .limit(1)

    const latestMeta = asMetaRecord(latestPayment?.metadata)
    if (latestMeta.zoho_synced === true) {
      console.log(`[Zoho Sync] Already synced, skipping: ${razorpayOrderId}`)
      return { shouldRetry: false }
    }

    console.warn(`[Zoho Sync] Could not acquire sync lock: ${razorpayOrderId}`)
    return { shouldRetry: true }
  }

  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      shippingPhone: orders.shippingPhone,
      shippingPhone2: orders.shippingPhone2,
      addressLine1: orders.addressLine1,
      addressLine2: orders.addressLine2,
      city: orders.city,
      state: orders.state,
      postalCode: orders.postalCode,
      userId: orders.userId,
    })
    .from(orders)
    .where(eq(orders.id, payment.orderId))
    .limit(1)

  if (!order) {
    console.error(`[Zoho Sync] Order not found: ${payment.orderId}`)
    await releaseZohoLock({
      razorpayOrderId,
      lockToken,
      metadata: lockMetadata,
      error: `Order not found: ${payment.orderId}`,
    })
    return { shouldRetry: false }
  }

  const items = await db
    .select({
      productName: orderItems.productName,
      quantity: orderItems.quantity,
      productPrice: orderItems.productPrice,
      variantTitle: orderItems.variantTitle,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))

  if (items.length === 0) {
    console.error(`[Zoho Sync] No items found for order: ${order.orderNumber}`)
    await releaseZohoLock({
      razorpayOrderId,
      lockToken,
      metadata: lockMetadata,
      error: `No items found for order: ${order.orderNumber}`,
    })
    return { shouldRetry: false }
  }

  // Guests also get a user row created at checkout, but keep this defensive.
  let userName = 'Customer'
  let userEmail = ''
  let userPhone: string | null = null

  if (order.userId) {
    const [user] = await db
      .select({
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1)

    if (user) {
      userName = user.name ?? 'Customer'
      userEmail = user.email
      userPhone = user.phone ?? null
    }
  }

  try {
    await pushLeadToZohoFlow(
      buildZohoPayload({
        fullName: userName,
        email: userEmail,
        shippingPhone: order.shippingPhone,
        // User's saved phone maps to Secondary_Mobile; fall back to second shipping phone.
        userPhone: userPhone ?? order.shippingPhone2 ?? null,
        addressLine1: order.addressLine1,
        addressLine2: order.addressLine2,
        city: order.city,
        state: order.state,
        postalCode: order.postalCode,
        orderStatus: order.status,
        items,
      }),
    )

    // Mark as permanently synced so duplicate webhooks skip this
    await db
      .update(payments)
      .set({
        metadata: {
          ...lockMetadata,
          zoho_synced: true,
          zoho_attempt_count: nextAttemptCount,
          zoho_sync_lock_token: null,
          zoho_sync_lock_until: null,
          zoho_next_retry_at: null,
          zoho_last_error: null,
          zoho_synced_at: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payments.providerOrderId, razorpayOrderId),
          sql`${payments.metadata}->>'zoho_sync_lock_token' = ${lockToken}`,
        ),
      )

    console.log(
      `[Zoho Sync] Lead pushed - order: ${order.orderNumber}, attempt: ${nextAttemptCount}`,
    )
    return { shouldRetry: false }
  } catch (err) {
    const shouldRetry = nextAttemptCount < ZOHO_MAX_ATTEMPTS
    const retryDelay = ZOHO_RETRY_DELAYS_MS[nextAttemptCount - 1]

    await releaseZohoLock({
      razorpayOrderId,
      lockToken,
      metadata: {
        ...lockMetadata,
        zoho_next_retry_at:
          shouldRetry && retryDelay
            ? new Date(Date.now() + retryDelay).toISOString()
            : null,
      },
      error: getErrorMessage(err),
    })

    console.error(
      `[Zoho Sync] Push failed (attempt ${nextAttemptCount}/${ZOHO_MAX_ATTEMPTS}), ` +
        `shouldRetry=${shouldRetry}, order: ${order.orderNumber}`,
      err,
    )
    return { shouldRetry }
  }
}

export async function POST(
  request: Request,
): Promise<Response> {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  try {
    if (!verifyRazorpayWebhookSignature({ body, signature })) {
      return Response.json(
        { error: 'Invalid webhook signature' },
        { status: 400 },
      )
    }

    const event = JSON.parse(body) as RazorpayWebhookPaymentEvent

    if (event.event !== 'payment.captured' && event.event !== 'payment.failed') {
      return Response.json({ received: true, ignored: true })
    }

    const payment = event.payload?.payment?.entity
    const providerOrderId = payment?.order_id

    if (!payment) {
      return Response.json(
        { error: 'Invalid payment event' },
        { status: 400 },
      )
    }

    if (!providerOrderId) {
      console.warn(`[Webhook] Missing Razorpay order id for event: ${event.event}`)
      return Response.json({ received: true })
    }

    if (event.event === 'payment.captured') {
      if (!isCapturedRazorpayPayment(payment)) {
        return Response.json(
          { error: 'Payment is not captured' },
          { status: 400 },
        )
      }

      if (payment.currency !== 'INR') {
        return Response.json(
          { error: 'Payment currency mismatch' },
          { status: 400 },
        )
      }

      let result: Awaited<ReturnType<typeof saveRazorpayPaymentStatus>>

      try {
        result = await saveRazorpayPaymentStatus({
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
      } catch (err) {
        // Race condition: Razorpay fired the webhook before the frontend finished
        // creating the order/payment row in the DB. Return 503 so Razorpay retries
        // in ~30 seconds, by which time the frontend will have completed.
        console.warn(
          `[Webhook] Payment row not ready yet, requesting retry: ${providerOrderId}`,
          err,
        )
        return Response.json({ retry: true }, { status: 503 })
      }

      // Emails only fire once (shouldNotifyPurchase is false on duplicate webhooks)
      if (result.shouldNotifyPurchase) {
        await sendPurchaseNotifications(result.orderId)
      }

      // Zoho sync runs on every webhook call.
      // syncOrderToZoho is self-contained: it reads zoho_synced / zoho_attempt_count
      // from payments.metadata and skips if already done.
      const { shouldRetry } = await syncOrderToZoho(providerOrderId)

      if (shouldRetry) {
        // Returning 503 asks Razorpay to retry this webhook delivery. Razorpay
        // controls the exact retry timing; our side stops after three retries.
        return Response.json({ retry: true }, { status: 503 })
      }

      return Response.json({ received: true })
    }

    if (event.event === 'payment.failed') {
      if (payment.currency !== 'INR') {
        return Response.json(
          { error: 'Payment currency mismatch' },
          { status: 400 },
        )
      }

      try {
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
      } catch (err) {
        // Same race condition guard for failed payments
        console.warn(
          `[Webhook] Payment row not ready for failed event, requesting retry: ${providerOrderId}`,
          err,
        )
        return Response.json({ retry: true }, { status: 503 })
      }

      return Response.json({ received: true })
    }

    return Response.json({ received: true, ignored: true })
  } catch (error) {
    console.error('Razorpay webhook failed:', error)
    return Response.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    )
  }
}
