/* eslint-disable @typescript-eslint/no-explicit-any */

import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { orders, orderItems, payments } from '@/db/schema/orders'
import { addresses, users } from '@/db/schema/users'
import { db } from '@/lib/db'
import type { OrderQuery, PaymentQuery } from '@/validators/admin-query.validator'

function pageValues(query: { page?: number; pageSize?: number }) {
  const page = Math.max(1, Number(query.page ?? 1))
  const pageSize = Math.max(1, Number(query.pageSize ?? 10))

  return { page, pageSize }
}

export async function findOrdersPage(query: OrderQuery) {
  const { page, pageSize } = pageValues(query)
  const filters = []

  if (query.status?.trim()) {
    filters.push(eq(orders.status, query.status.trim() as any))
  }

  if (query.search?.trim()) {
    const search = `%${query.search.trim()}%`
    filters.push(or(sql`${orders.id}::text ILIKE ${search}`, ilike(orders.orderNumber, search)))
  }

  const where = filters.length ? and(...filters) : undefined
  const [totalResult] = await db
    .select({ value: count() })
    .from(orders)
    .where(where)

  const data = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return {
    data,
    page,
    pageSize,
    totalItems: totalResult?.value ?? 0,
  }
}

export async function updateOrderStatusRecord(orderId: string, status: string) {
  const [existingOrder] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      previousStatus: orders.status,
      userEmail: users.email,
      userName: users.name,
      courierName: orders.courierName,
      trackingNumber: orders.trackingNumber,
      trackingUrl: orders.trackingUrl,
      deliveredAt: orders.deliveredAt,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1)

  await db
    .update(orders)
    .set({
      status: status as any,
      updatedAt: new Date(),
      ...(status === 'shipped' ? { shipedAt: new Date() } : {}),
      ...(status === 'delivered' ? { deliveredAt: new Date() } : {}),
    })
    .where(eq(orders.id, orderId))

  return existingOrder ?? null
}

export async function findOrderDetails(id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id))

  if (!order) return null

  const [user] = order.userId
    ? await db.select().from(users).where(eq(users.id, order.userId))
    : [null]

  const [address] = order.addressId
    ? await db.select().from(addresses).where(eq(addresses.id, order.addressId))
    : [null]

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))

  return {
    order,
    address,
    users: user,
    items,
  }
}

export async function findPurchasePaymentsPage(query: PaymentQuery) {
  const { page, pageSize } = pageValues(query)
  const filters = []

  if (query.paymentStatus?.trim()) {
    filters.push(eq(payments.status, query.paymentStatus.trim() as any))
  }

  if (query.search?.trim()) {
    const search = `%${query.search.trim()}%`
    filters.push(
      or(
        ilike(orders.id, search),
        ilike(orders.orderNumber, search),
        ilike(users.email, search),
        ilike(users.name, search),
        ilike(payments.providerPaymentId, search),
        ilike(payments.providerOrderId, search),
      ),
    )
  }

  const where = filters.length ? and(...filters) : undefined
  const [totalResult] = await db
    .select({ value: count() })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .where(where)

  const rows = await db
    .select({
      payment: payments,
      order: orders,
      user: users,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .where(where)
    .orderBy(desc(payments.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return {
    rows,
    page,
    pageSize,
    totalItems: totalResult?.value ?? 0,
  }
}
