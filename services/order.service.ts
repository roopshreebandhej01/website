import {
  countDashboardOrders,
  findDashboardOrderDetailRow,
  findOrderDetailRowById,
  findOrderById,
  listDashboardOrderRows,
  updateOrderStatusRecord,
} from '@/repositories/order.repository'
import { getCurrentDbUserId } from '@/lib/current-db-user'
import { getCurrentUser } from '@/lib/auth'
import { getS3ObjectPreviewUrl } from '@/lib/s3'

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
      status:
        row.order.status === 'cancelled'
          ? 'Failed'
          : row.payment
          ? getStatusLabel(row.payment.status)
          : 'Failed',
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
  const [details, sessionUser] = await Promise.all([
    getDashboardOrderDetails(orderId),
    getCurrentUser(),
  ])

  if (details) {
    return {
      order: {
        id: details.order.id,
        orderId: details.order.orderNumber,
        email: sessionUser?.email ?? '',
        orderDate: formatDate(details.order.createdAt),
        paymentMethod:
          details.payment.method?.toUpperCase() ??
          details.payment.provider.toUpperCase(),
        paymentStatus:
          details.order.rawStatus === 'cancelled'
            ? 'Failed'
            : details.payment.status,
        estimatedDelivery: '3 - 5 Days',
        totalPaid: formatCurrency(details.order.totalAmount),
      },
      address: {
        name: sessionUser?.name || sessionUser?.email?.split('@')[0] || 'Customer',
        line1: details.address.line,
        phone: details.address.phone,
      },
      items: details.items.map((item) => ({
        product: item.product,
        variant: item.variant || 'Default',
        quantity: item.quantity,
        total: item.total,
        image: item.image,
      })),
    }
  }

  // Fallback: directly find order by id or orderNumber
  const directRow = await findOrderDetailRowById(orderId)
  if (!directRow) {
    return null
  }

  return {
    order: {
      orderId: directRow.order.orderNumber,
      email: sessionUser?.email ?? '',
      orderDate: formatDate(directRow.order.createdAt),
      paymentMethod:
        directRow.payment?.method?.toUpperCase() ??
        directRow.payment?.provider?.toUpperCase() ??
        'ONLINE',
      paymentStatus:
        directRow.order.status === 'cancelled' || directRow.payment?.status === 'failed'
          ? 'Failed'
          : directRow.payment
          ? getStatusLabel(directRow.payment.status)
          : 'Pending',
      estimatedDelivery: '3 - 5 Days',
      totalPaid: formatCurrency(directRow.order.totalAmount),
    },
    address: {
      name: sessionUser?.name || sessionUser?.email?.split('@')[0] || 'Customer',
      line1: [
        directRow.order.addressLine1,
        directRow.order.addressLine2,
        directRow.order.city,
        directRow.order.state,
        directRow.order.postalCode,
        directRow.order.country,
      ]
        .filter(Boolean)
        .join(', '),
      phone: directRow.order.shippingPhone,
    },
    items: directRow.items.map((item) => ({
      product: item.productName,
      variant: item.variantTitle ?? 'Default',
      quantity: item.quantity,
      total: formatCurrency(item.productPrice * item.quantity),
      image: item.productImage ? getS3ObjectPreviewUrl(item.productImage) : '/home/new-arrival-model.png',
    })),
  }
}
