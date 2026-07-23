import { notFound, redirect } from "next/navigation"

import { OrderInvoice } from "@/components/order/OrderInvoice"
import { getOrderConfirmationInvoiceDetails } from "@/services/order.service"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const { orderId } = await searchParams

  if (!orderId) {
    redirect("/")
  }

  const invoice = await getOrderConfirmationInvoiceDetails(orderId)

  if (!invoice) {
    notFound()
  }

  return (
    <OrderInvoice
      invoice={invoice}
      backHref={`/order-confirmation?orderId=${encodeURIComponent(orderId)}`}
    />
  )
}
