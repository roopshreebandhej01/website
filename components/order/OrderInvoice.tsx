import Link from "next/link";

import { PrintInvoiceButton } from "@/components/order/PrintInvoiceButton";

export type InvoiceItem = {
  id: string;
  product: string;
  sku?: string | null;
  variant?: string | null;
  quantity: number;
  unitPrice: string;
  total: string;
};

export type InvoiceData = {
  orderId: string;
  orderDate: string;
  status: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  subtotal: string;
  deliveryCharge: string;
  total: string;
  items: InvoiceItem[];
};

export function OrderInvoice({
  invoice,
  backHref,
}: {
  invoice: InvoiceData;
  backHref: string;
}) {
  return (
    <main className="min-h-screen bg-[#f8f0e6] px-4 py-8 text-[#2d180f] print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between gap-4 print:hidden">
          <Link
            href={backHref}
            className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C39150]"
          >
            Back to order
          </Link>
          <PrintInvoiceButton />
        </div>

        <section className="bg-white p-6 shadow-sm print:shadow-none sm:p-8">
          <div className="flex flex-col gap-5 border-b border-[#ead8c4] pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C39150]">
                Roopshree Bandhej
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold text-[#2d180f]">
                Invoice
              </h1>
            </div>
            <div className="text-sm sm:text-right">
              <p className="font-semibold text-black">
                Order {invoice.orderId}
              </p>
              <p className="mt-1 text-[#666]">{invoice.orderDate}</p>
              <p className="mt-2 inline-flex rounded-full bg-[#f1dfc7] px-3 py-1 text-xs font-semibold text-[#3f2617]">
                {invoice.status}
              </p>
            </div>
          </div>

          <div className="grid gap-6 border-b border-[#ead8c4] py-6 text-sm sm:grid-cols-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#777]">
                Bill To
              </h2>
              <p className="mt-3 font-semibold text-black">
                {invoice.customerName}
              </p>
              {invoice.customerEmail ? (
                <p className="mt-1 break-all text-[#666]">{invoice.customerEmail}</p>
              ) : null}
              {invoice.customerPhone ? (
                <p className="mt-1 text-[#666]">{invoice.customerPhone}</p>
              ) : null}
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#777]">
                Shipping Address
              </h2>
              <p className="mt-3 leading-6 text-[#555]">
                {invoice.shippingAddress}
              </p>
              {invoice.paymentMethod || invoice.paymentStatus ? (
                <p className="mt-3 text-[#666]">
                  Payment:{" "}
                  {[invoice.paymentMethod, invoice.paymentStatus]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto py-6">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[#ead8c4] text-xs uppercase tracking-[0.08em] text-[#777]">
                <tr>
                  <th className="py-3 pr-4">Item</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="py-3 pl-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ead8c4]">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-black">{item.product}</p>
                      {item.variant ? (
                        <p className="mt-1 text-xs text-[#777]">
                          Variant: {item.variant}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-[#666]">{item.sku || "-"}</td>
                    <td className="px-4 py-4 text-center">{item.quantity}</td>
                    <td className="px-4 py-4 text-right">{item.unitPrice}</td>
                    <td className="py-4 pl-4 text-right font-semibold text-black">
                      {item.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto w-full max-w-xs border-t border-[#ead8c4] pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[#666]">Subtotal</span>
              <span className="font-semibold">{invoice.subtotal}</span>
            </div>
            <div className="mt-3 flex justify-between gap-4">
              <span className="text-[#666]">Delivery Charge</span>
              <span className="font-semibold">{invoice.deliveryCharge}</span>
            </div>
            <div className="mt-3 flex justify-between gap-4 text-lg font-semibold text-black">
              <span>Total</span>
              <span>{invoice.total}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
