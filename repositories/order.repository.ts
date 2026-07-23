import { count, desc, eq, inArray, or } from 'drizzle-orm'

import { orderItems, orders, payments } from '@/db/schema/orders'
import { addresses, users } from '@/db/schema/users'
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

function getOrderIdCondition(orderIdParam: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    orderIdParam,
  )
  if (isUuid) {
    return or(eq(orders.id, orderIdParam), eq(orders.orderNumber, orderIdParam))
  }
  return eq(orders.orderNumber, orderIdParam)
}

export async function findDashboardOrderDetailRow(userId: string, orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(getOrderIdCondition(orderId))
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

  const [address] = order.addressId
    ? await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, order.addressId))
        .limit(1)
    : [null]

  return {
    order,
    items,
    payment: payment ?? null,
    address: address ?? null,
  }
}

export async function findOrderConfirmationDetailRow(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(getOrderIdCondition(orderId))
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

  let user = null
  if (order.userId) {
    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1)
    user = foundUser ?? null
  }

  const [address] = order.addressId
    ? await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, order.addressId))
        .limit(1)
    : [null]

  return {
    order,
    items,
    payment: payment ?? null,
    address: address ?? null,
    user,
  }
}
