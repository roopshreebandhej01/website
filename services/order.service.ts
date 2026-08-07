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
import { getPaiseOrderSummary } from '@/lib/checkout-pricing'
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

function getOrderPricing(items: Array<{ productPrice: number; quantity: number }>) {
  return getPaiseOrderSummary(
    items.map((item) => ({
      price: item.productPrice,
      quantity: item.quantity,
    })),
  )
}

function getStoredDeliveryCharge(totalAmount: number, subtotal: number) {
  return Math.max(0, totalAmount - subtotal)
}

function formatDeliveryCharge(amountInPaise: number) {
  return amountInPaise > 0 ? formatCurrency(amountInPaise) : 'Free'
}

function getCustomerName({
  addressName,
  userName,
  userEmail,
}: {
  addressName?: string | null
  userName?: string | null
  userEmail?: string | null
}) {
  return addressName || userName || userEmail?.split('@')[0] || 'Customer'
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

  const pricing = getOrderPricing(row.items)
  const deliveryCharge = getStoredDeliveryCharge(
    row.order.totalAmount,
    pricing.subtotal,
  )
  const sessionUser = await getCurrentUser()
  const customerName = getCustomerName({
    addressName: row.address?.fullName,
    userName: sessionUser?.name,
    userEmail: sessionUser?.email,
  })

  return {
    customer: {
      name: customerName,
      email: sessionUser?.email ?? null,
    },
    order: {
      ...mapOrderCard({ order: row.order, items: row.items }),
      rawStatus: row.order.status,
      orderNumber: row.order.orderNumber,
      createdAt: row.order.createdAt,
      totalAmount: row.order.totalAmount,
    },
    summary: [
      { label: 'Subtotal', value: formatCurrency(pricing.subtotal) },
      {
        label: 'Delivery Charge',
        value: formatDeliveryCharge(deliveryCharge),
      },
      { label: 'Total', value: formatCurrency(row.order.totalAmount), strong: true },
    ],
    payment: {
      provider: row.payment?.provider ?? 'razorpay',
      method: row.payment?.method ?? null,
      status: row.payment ? getStatusLabel(row.payment.status) : 'Pending',
      providerPaymentId: row.payment?.providerPaymentId ?? null,
    },
    address: {
      name: customerName,
      phone: row.address?.phone ?? row.order.shippingPhone,
      secondPhone: row.order.shippingPhone2,
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

  if (
    !details ||
    !details.payment ||
    !['paid', 'pending'].includes(details.payment.status)
  ) {
    return null
  }

  const pricing = getOrderPricing(details.items)
  const deliveryCharge = getStoredDeliveryCharge(
    details.order.totalAmount,
    pricing.subtotal,
  )

  return {
    order: {
      orderId: details.order.orderNumber,
      email: details.user?.email ?? '',
      isPaid: details.payment.status === 'paid',
      orderDate: formatDate(details.order.createdAt),
      paymentMethod:
        details.payment?.method?.toUpperCase() ??
        details.payment?.provider?.toUpperCase() ?? 'RAZORPAY',
      paymentStatus: details.payment ? getStatusLabel(details.payment.status) : 'Pending',
      estimatedDelivery: '3 - 5 Days',
      deliveryCharge: formatDeliveryCharge(deliveryCharge),
      totalPaid: formatCurrency(details.order.totalAmount),
    },
    address: {
      name: getCustomerName({
        addressName: details.address?.fullName,
        userName: details.user?.name,
        userEmail: details.user?.email,
      }),
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
      secondPhone: details.order.shippingPhone2,
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

  if (!details || details.payment?.status !== 'paid') {
    return null
  }

  const pricing = getOrderPricing(details.items)
  const deliveryCharge = getStoredDeliveryCharge(
    details.order.totalAmount,
    pricing.subtotal,
  )

  return {
    orderId: details.order.orderNumber || details.order.id,
    orderDate: formatDate(details.order.createdAt),
    status: getStatusLabel(details.order.status),
    customerName: getCustomerName({
      addressName: details.address?.fullName,
      userName: details.user?.name,
      userEmail: details.user?.email,
    }),
    customerEmail: details.user?.email ?? null,
    customerPhone: details.order.shippingPhone,
    customerPhone2: details.order.shippingPhone2,
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
    subtotal: formatCurrency(pricing.subtotal),
    deliveryCharge: formatDeliveryCharge(deliveryCharge),
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
