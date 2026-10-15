import Link from "next/link"

import { formatPrice, FREE_DELIVERY_THRESHOLD } from "@/components/global/const"

export function OrderSummary({
  subtotal,
  shipping,
  gst,
  total,
}: {
  subtotal: number
  shipping: number
  gst: number
  total: number
}) {
  return (
    <aside className="bg-[#3F2617] px-5 py-6 text-white shadow-sm lg:sticky lg:top-24">
      <h2 className="font-heading text-lg font-semibold">Order Summary</h2>
      <div className="mt-7 space-y-3.5 text-[11px]">
        <SummaryLine label="Subtotal" value={formatPrice(subtotal)} />
        <div>
          <SummaryLine
            label="Delivery Charge"
            value={shipping === 0 ? "FREE" : formatPrice(shipping)}
          />
          {shipping > 0 && (
            <p className="mt-0.5 text-[10px] text-white/50">
              Free delivery on orders {formatPrice(FREE_DELIVERY_THRESHOLD)} and above.
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 border-t border-white/15 pt-5 text-[11px]">
        <SummaryLine label="Total" value={formatPrice(total)} strong />
      </div>
      <Link
        href="/checkout"
        className="mt-8 flex h-11 w-full items-center justify-center bg-[#C39150] px-5 text-[11px] font-semibold text-white transition hover:bg-white hover:text-[#3F2617]"
      >
        Proceed to Checkout
      </Link>
    </aside>
  )
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-6 ${
        strong ? "font-semibold" : "text-white/90"
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
