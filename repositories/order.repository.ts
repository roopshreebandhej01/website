import { count, desc, eq, inArray, or } from 'drizzle-orm'

import { orderItems, orders, payments } from '@/db/schema/orders'
import { db } from '@/lib/db'

type OrderRecord = {
  id: string
  status: string
  totalInPaise: number
}

export async function findOrderById(orderId: string): Promise<OrderRecord | null> {
  void db
  void orderId

  // Replace with a Drizzle select by id.
  return null satisfies OrderRecord | null
}

export async function updateOrderStatusRecord(
  orderId: string,
  status: string,
): Promise<OrderRecord> {
  void db
  void orderId
  void status

  // Replace with a Drizzle update by id.
  throw new Error('Order status update query not implemented')
}

export async function listDashboardOrderRows(userId: string, limit?: number) {
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit ?? 50)

  if (userOrders.length === 0) {
    return []
  }

  const orderIds = userOrders.map((order) => order.id)
  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds))

  return userOrders.map((order) => ({
    order,
    items: items.filter((item) => item.orderId === order.id),
  }))
}

export async function countDashboardOrders(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.userId, userId))

  return row?.value ?? 0
}

export async function findDashboardOrderDetailRow(userId: string, orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(or(eq(orders.id, orderId), eq(orders.orderNumber, orderId)))
    .limit(1)

  if (!order || order.userId !== userId) {
    return null
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .limit(1)

  return {
    order,
    items,
    payment: payment ?? null,
  }
}

export async function findOrderDetailRowById(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(or(eq(orders.id, orderId), eq(orders.orderNumber, orderId)))
    .limit(1)

  if (!order) {
    return null
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .limit(1)

  return {
    order,
    items,
    payment: payment ?? null,
  }
}

