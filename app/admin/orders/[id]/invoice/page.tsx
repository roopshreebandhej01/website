import { notFound } from "next/navigation";

import { OrderInvoice, type InvoiceData } from "@/components/order/OrderInvoice";
import { fetchOrderDetailsService } from "@/services/admin.service";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amountInPaise: number) {
  return `₹${(amountInPaise / 100).toLocaleString("en-IN")}`;
}

function getStatusLabel(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const details = await fetchOrderDetailsService(id);

  if (!details) {
    notFound();
  }

  const subtotal = details.items.reduce(
    (sum, item) => sum + item.productPrice * item.quantity,
    0,
  );
  const deliveryCharge = Math.max(0, details.order.totalAmount - subtotal);
  const customerName =
    details.address?.fullName ||
    details.users?.name ||
    details.users?.email?.split("@")[0] ||
    details.order.shippingPhone ||
    "Customer";
  const shippingAddress = [
    details.order.addressLine1,
    details.order.addressLine2,
    details.order.city,
    details.order.state,
    details.order.postalCode,
    details.order.country,
  ]
    .filter(Boolean)
    .join(", ");

  const invoice: InvoiceData = {
    orderId: details.order.orderNumber || details.order.id,
    orderDate: formatDate(details.order.createdAt),
    status: getStatusLabel(details.order.status),
    customerName,
    customerEmail: details.users?.email,
    customerPhone: details.address?.phone ?? details.users?.phone ?? details.order.shippingPhone,
    customerPhone2:
      details.order.shippingPhone2 ?? details.users?.secondPhone ?? null,
    shippingAddress,
    subtotal: formatCurrency(subtotal),
    deliveryCharge:
      deliveryCharge > 0 ? formatCurrency(deliveryCharge) : "Free",
    total: formatCurrency(details.order.totalAmount),
    items: details.items.map((item) => ({
      id: item.id,
      product: item.productName,
      sku: item.productSku,
      variant: item.variantTitle,
      quantity: item.quantity,
      unitPrice: formatCurrency(item.productPrice),
      total: formatCurrency(item.productPrice * item.quantity),
    })),
  };

  return (
    <OrderInvoice invoice={invoice} backHref={`/admin/orders/${details.order.id}`} />
  );
}
