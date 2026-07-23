import { notFound } from "next/navigation";

import { OrderInvoice, type InvoiceData } from "@/components/order/OrderInvoice";
import { getDashboardOrderDetails } from "@/services/order.service";

export default async function Page({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const details = await getDashboardOrderDetails(orderId);

  if (!details) {
    notFound();
  }

  const invoice: InvoiceData = {
    orderId: details.order.orderNumber || details.order.id,
    orderDate: details.order.date,
    status: details.order.status,
    customerName: details.address.name || "Customer",
    customerEmail: details.customer.email,
    customerPhone: details.address.phone,
    shippingAddress: details.address.line,
    paymentMethod:
      details.payment.method?.toUpperCase() ??
      details.payment.provider.toUpperCase(),
    paymentStatus: details.payment.status,
    subtotal: details.summary[0]?.value ?? details.order.total,
    deliveryCharge:
      details.summary.find((item) => item.label === "Delivery Charge")?.value ??
      "Free",
    total: details.order.total,
    items: details.items.map((item) => ({
      id: item.id,
      product: item.product,
      variant: item.variant,
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.total,
    })),
  };

  return (
    <OrderInvoice
      invoice={invoice}
      backHref={`/dashboard/orders/${details.order.slug}`}
    />
  );
}
