import Link from "next/link"

import { formatPrice } from "@/components/global/const"

export function OrderSummary({
  subtotal,
  shipping,
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
        <SummaryLine
          label="Delivery Charge"
          value={shipping > 0 ? formatPrice(shipping) : "Free"}
        />
        <p className="pt-1 text-[10px] leading-4 text-white/65">
          {shipping > 0
            ? "Free delivery on orders ₹500 and above."
            : "Free delivery applied."}
        </p>
      </div>
      <div className="mt-6 border-t border-white/15 pt-5 text-[11px]">
        <SummaryLine label="Total" value={formatPrice(total)} strong />
      </div>
      <Link
        href="/checkout"
        className="mt-20 flex h-11 w-full items-center justify-center bg-[#C39150] px-5 text-[11px] font-semibold text-white transition hover:bg-white hover:text-[#3F2617]"
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
