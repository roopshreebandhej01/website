import { and, count, eq, inArray, ne, sql } from "drizzle-orm"

import { cartItems, carts, orderItems, payments, orders } from "@/db/schema/orders"
import { users } from "@/db/schema/users"
import { db } from "@/lib/db"
import {
  notifyFirstOrderEmail,
  notifyOrderConfirmationEmail,
} from "@/lib/email-notifications"

type PaymentMetadata = Record<string, unknown>
type DbPaymentStatus = typeof payments.$inferSelect.status
type DbOrderStatus = typeof orders.$inferSelect.status

type SaveRazorpayPaymentStatusInput = {
  providerOrderId: string
  providerPaymentId?: string | null
  amountInPaise?: number | null
  method?: string | null
  razorpayStatus: string
  metadata?: PaymentMetadata
}

type MappedPaymentStatus = {
  paymentStatus: DbPaymentStatus
  orderStatus: DbOrderStatus
}

function asPaymentMetadata(value: unknown): PaymentMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as PaymentMetadata
}

function getOrderStatusCondition(orderId: string, status: DbOrderStatus) {
  switch (status) {
    case "paid":
      return and(
        eq(orders.id, orderId),
        inArray(orders.status, ["pending", "confirmed", "cancelled"]),
      )
    case "confirmed":
      return and(eq(orders.id, orderId), eq(orders.status, "pending"))
    case "cancelled":
      return and(
        eq(orders.id, orderId),
        inArray(orders.status, ["pending", "confirmed"]),
      )
    default:
      return eq(orders.id, orderId)
  }
}

export function mapRazorpayPaymentStatusToDb(
  razorpayStatus: string,
): MappedPaymentStatus {
  switch (razorpayStatus) {
    case "authorized":
      return { paymentStatus: "authorized", orderStatus: "confirmed" }
    case "captured":
      return { paymentStatus: "paid", orderStatus: "paid" }
    case "failed":
      return { paymentStatus: "failed", orderStatus: "cancelled" }
    case "refunded":
      return { paymentStatus: "refunded", orderStatus: "refunded" }
    case "created":
    default:
      return { paymentStatus: "pending", orderStatus: "pending" }
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatCurrency(amountInPaise: number) {
  return `₹${(amountInPaise / 100).toLocaleString("en-IN")}`
}

export async function saveRazorpayPaymentStatus(
  input: SaveRazorpayPaymentStatusInput,
) {
  const mappedStatus = mapRazorpayPaymentStatusToDb(input.razorpayStatus)

  return db.transaction(async (tx) => {
    const [paymentRow] = await tx
      .select({
        id: payments.id,
        orderId: payments.orderId,
        status: payments.status,
        amountInPaise: payments.amountInPaise,
        metadata: payments.metadata,
      })
      .from(payments)
      .where(eq(payments.providerOrderId, input.providerOrderId))
      .limit(1)

    if (!paymentRow) {
      throw new Error("Payment record not found")
    }

    if (
      input.amountInPaise != null &&
      paymentRow.amountInPaise !== input.amountInPaise
    ) {
      throw new Error("Payment amount mismatch")
    }

    if (
      paymentRow.status === "paid" &&
      mappedStatus.paymentStatus !== "paid" &&
      mappedStatus.paymentStatus !== "refunded"
    ) {
      return {
        orderId: paymentRow.orderId,
        shouldNotifyPurchase: false,
        paymentStatus: paymentRow.status,
        orderStatus: "paid" satisfies DbOrderStatus,
      }
    }

    const existingMetadata = asPaymentMetadata(paymentRow.metadata)
    const nextMetadata = {
      ...existingMetadata,
      ...asPaymentMetadata(input.metadata),
    }

    const [updatedPayment] = await tx
      .update(payments)
      .set({
        status: mappedStatus.paymentStatus,
        providerPaymentId: input.providerPaymentId ?? null,
        ...(input.amountInPaise ? { amountInPaise: input.amountInPaise } : {}),
        method: input.method ?? null,
        metadata: nextMetadata,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payments.providerOrderId, input.providerOrderId),
          ne(payments.status, mappedStatus.paymentStatus),
        ),
      )
      .returning({
        id: payments.id,
        orderId: payments.orderId,
      })

    await tx
      .update(orders)
      .set({
        status: mappedStatus.orderStatus,
        updatedAt: new Date(),
      })
      .where(getOrderStatusCondition(paymentRow.orderId, mappedStatus.orderStatus))

    const clearDbCartUserId = existingMetadata.clearDbCartUserId
    if (
      updatedPayment &&
      mappedStatus.paymentStatus === "paid" &&
      typeof clearDbCartUserId === "string" &&
      clearDbCartUserId
    ) {
      await tx.execute(
        sql`
          DELETE FROM ${cartItems}
          USING ${carts}
          WHERE ${cartItems.cartId} = ${carts.id}
          AND ${carts.userId} = ${clearDbCartUserId}
        `,
      )
    }

    return {
      orderId: paymentRow.orderId,
      shouldNotifyPurchase:
        mappedStatus.paymentStatus === "paid" && Boolean(updatedPayment),
      paymentStatus: mappedStatus.paymentStatus,
      orderStatus: mappedStatus.orderStatus,
    }
  })
}

export async function sendPurchaseNotifications(orderId: string) {
  const [row] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      totalAmount: orders.totalAmount,
      userId: orders.userId,
      userEmail: users.email,
      userName: users.name,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!row?.userEmail) {
    return
  }

  const customerName = row.userName || row.userEmail.split("@")[0] || "Customer"
  const orderNumber = row.orderNumber || row.id
  const items = await db
    .select({
      productName: orderItems.productName,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
  const productNames =
    items
      .map((item) => item.productName)
      .filter(Boolean)
      .join(", ") || "Your Roopshree purchase"

  try {
    await notifyOrderConfirmationEmail({
      email: row.userEmail,
      customerName,
      orderId: orderNumber,
      orderDate: formatDate(row.createdAt),
      productNames,
      orderTotal: formatCurrency(row.totalAmount),
    })
  } catch (emailError) {
    console.error("Unable to send order confirmation email:", emailError)
  }

  if (!row.userId) {
    return
  }

  try {
    const [orderCount] = await db
      .select({ value: count() })
      .from(orders)
      .where(eq(orders.userId, row.userId))

    if ((orderCount?.value ?? 0) === 1) {
      await notifyFirstOrderEmail({
        email: row.userEmail,
        customerName,
      })
    }
  } catch (emailError) {
    console.error("Unable to send first order email:", emailError)
  }
}
