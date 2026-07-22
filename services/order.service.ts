import {
  countDashboardOrders,
  findDashboardOrderDetailRow,
  findOrderById,
  findOrderConfirmationDetailRow,
  listDashboardOrderRows,
  updateOrderStatusRecord,
} from '@/repositories/order.repository'
import { getCurrentDbUserId } from '@/lib/current-db-user'
import { getCurrentUser } from '@/lib/auth'
import { getS3ObjectPreviewUrl } from '@/lib/s3'
import type { InvoiceData } from '@/components/order/OrderInvoice'

const allowedOrderStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

export async function updateOrderStatus(orderId: string, status: string) {
  if (!allowedOrderStatuses.includes(status)) {
    throw new Error('Invalid order status')
  }

  const order = await findOrderById(orderId)

  if (!order) {
    throw new Error('Order not found')
  }

  return updateOrderStatusRecord(orderId, status)
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(amountInPaise: number) {
  return `₹${(amountInPaise / 100).toLocaleString('en-IN')}`
}

function getStatusTone(status: string) {
  return ['delivered', 'paid', 'confirmed'].includes(status) ? 'green' : 'blue'
}

function getStatusLabel(status: string) {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getSubtotal(items: Array<{ productPrice: number; quantity: number }>) {
  return items.reduce(
    (total, item) => total + item.productPrice * item.quantity,
    0,
  )
}

function mapOrderCard(row: Awaited<ReturnType<typeof listDashboardOrderRows>>[number]) {
  const totalQuantity = row.items.reduce((total, item) => total + item.quantity, 0)
  const itemCount = row.items.length
  const itemLabel = itemCount === 1 ? 'item' : 'items'
  const quantityLabel = totalQuantity === 1 ? 'piece' : 'pieces'

  return {
    id: row.order.orderNumber || row.order.id,
    slug: row.order.id,
    date: formatDate(row.order.createdAt),
    total: formatCurrency(row.order.totalAmount),
    status: getStatusLabel(row.order.status),
    statusTone: getStatusTone(row.order.status),
    itemCount,
    quantity: totalQuantity,
    summary: `${itemCount} ${itemLabel} · ${totalQuantity} ${quantityLabel}`,
  }
}

export type DashboardOrderCardView = ReturnType<typeof mapOrderCard>

export async function getDashboardOrders(limit?: number) {
  const userId = await getCurrentDbUserId()

  if (!userId) {
    return []
  }

  const rows = await listDashboardOrderRows(userId, limit)

  return rows.map(mapOrderCard)
}

export async function getDashboardOrderCount() {
  const userId = await getCurrentDbUserId()

  if (!userId) {
    return 0
  }

  return countDashboardOrders(userId)
}

export async function getDashboardOrderDetails(orderId: string) {
  const userId = await getCurrentDbUserId()

  if (!userId) {
    return null
  }

  const row = await findDashboardOrderDetailRow(userId, orderId)

  if (!row) {
    return null
  }

  const subtotal = getSubtotal(row.items)
  const shipping = 0
  const gst = Math.max(0, row.order.totalAmount - subtotal - shipping)

  return {
    order: {
      ...mapOrderCard({ order: row.order, items: row.items }),
      rawStatus: row.order.status,
      orderNumber: row.order.orderNumber,
      createdAt: row.order.createdAt,
      totalAmount: row.order.totalAmount,
    },
    summary: [
      { label: 'Subtotal', value: formatCurrency(subtotal) },
      { label: 'Total', value: formatCurrency(row.order.totalAmount), strong: true },
    ],
    payment: {
      provider: row.payment?.provider ?? 'razorpay',
      method: row.payment?.method ?? null,
      status: row.payment ? getStatusLabel(row.payment.status) : 'Pending',
      providerPaymentId: row.payment?.providerPaymentId ?? null,
    },
    address: {
      name: row.order.shippingPhone,
      phone: row.order.shippingPhone,
      line: [
        row.order.addressLine1,
        row.order.addressLine2,
        row.order.city,
        row.order.state,
        row.order.postalCode,
        row.order.country,
      ]
        .filter(Boolean)
        .join(', '),
    },
    items: row.items.map((item) => ({
      id: item.id,
      product: item.productName,
      variant: item.variantTitle ?? '',
      quantity: item.quantity,
      price: formatCurrency(item.productPrice),
      total: formatCurrency(item.productPrice * item.quantity),
      image: item.productImage ? getS3ObjectPreviewUrl(item.productImage) : '/home/new-arrival-model.png',
    })),
  }
}

export async function getOrderConfirmationDetails(orderId: string) {
  const details = await findOrderConfirmationDetailRow(orderId)

  if (!details) {
    return null
  }

  const subtotal = getSubtotal(details.items)

  return {
    order: {
      orderId: details.order.orderNumber,
      email: details.user?.email ?? '',
      orderDate: formatDate(details.order.createdAt),
      paymentMethod:
        details.payment?.method?.toUpperCase() ??
        details.payment?.provider?.toUpperCase() ?? 'RAZORPAY',
      paymentStatus: details.payment ? getStatusLabel(details.payment.status) : 'Pending',
      estimatedDelivery: '3 - 5 Days',
      totalPaid: formatCurrency(details.order.totalAmount),
    },
    address: {
      name: details.user?.name || details.user?.email?.split('@')[0] || 'Customer',
      line1: [
        details.order.addressLine1,
        details.order.addressLine2,
        details.order.city,
        details.order.state,
        details.order.postalCode,
      ]
        .filter(Boolean)
        .join(', '),
      phone: details.order.shippingPhone,
    },
    items: details.items.map((item) => ({
      product: item.productName,
      variant: item.variantTitle || 'Default',
      quantity: item.quantity,
      total: formatCurrency(item.productPrice * item.quantity),
      image: item.productImage ? getS3ObjectPreviewUrl(item.productImage) : '/home/new-arrival-model.png',
    })),
  }
}

export async function getOrderConfirmationInvoiceDetails(orderId: string): Promise<InvoiceData | null> {
  const details = await findOrderConfirmationDetailRow(orderId)

  if (!details) {
    return null
  }

  const subtotal = getSubtotal(details.items)

  return {
    orderId: details.order.orderNumber || details.order.id,
    orderDate: formatDate(details.order.createdAt),
    status: getStatusLabel(details.order.status),
    customerName: details.user?.name || details.user?.email?.split('@')[0] || 'Customer',
    customerEmail: details.user?.email ?? null,
    customerPhone: details.order.shippingPhone,
    shippingAddress: [
      details.order.addressLine1,
      details.order.addressLine2,
      details.order.city,
      details.order.state,
      details.order.postalCode,
      details.order.country,
    ]
      .filter(Boolean)
      .join(', '),
    paymentMethod:
      details.payment?.method?.toUpperCase() ??
      details.payment?.provider?.toUpperCase() ?? 'RAZORPAY',
    paymentStatus: details.payment ? getStatusLabel(details.payment.status) : 'Paid',
    subtotal: formatCurrency(subtotal),
    total: formatCurrency(details.order.totalAmount),
    items: details.items.map((item) => ({
      id: item.id,
      product: item.productName,
      sku: item.productSku,
      variant: item.variantTitle || 'Default',
      quantity: item.quantity,
      unitPrice: formatCurrency(item.productPrice),
      total: formatCurrency(item.productPrice * item.quantity),
    })),
  }
}
